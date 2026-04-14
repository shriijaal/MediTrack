import { useState, useEffect } from "react";
import { Icons } from "../../components/icons/Icons";
import { SvgI } from "../../components/icons/Icons";
import { getMeds, saveMeds, getRx, getDoseLog, saveDoseLog } from "../../services/storage";
import { apiFetch } from "../../services/api";
import { expSt, fmt12 } from "../../utils/formatters";
import { mapMed } from "../../utils/mappers";

export function Dashboard({ userId, onMeds, onRx, onExpiry, onReports }) {
  const [meds, setMeds] = useState(() => getMeds(userId));
  const [rx, setRx] = useState(() => getRx(userId));
  // Load fresh data from backend on mount
  useEffect(() => {
    // Load medicines
    apiFetch(`/medicines.php?patient_id=${userId}`)
      .then(data => {
        const mapped = data.map(mapMed);
        setMeds(mapped);
        saveMeds(userId, mapped);
      })
      .catch(() => { }); // offline — already using localStorage
  }, [userId]);

  // ── Dose log: stored per day locally + synced to backend ──────
  const todayKey = new Date().toISOString().split("T")[0];
  const [doseLog, setDoseLog] = useState(() => getDoseLog(userId, todayKey));

  // Load today's dose logs from backend on mount
  useEffect(() => {
    apiFetch(`/doses.php?patient_id=${userId}&date=${todayKey}`)
      .then(data => {
        // data is a flat map: { "medicineId_HH:MM": "taken"|"missed" }
        setDoseLog(data);
        saveDoseLog(userId, todayKey, data);
      })
      .catch(() => { }); // offline — use localStorage
  }, [userId, todayKey]);

  const markDose = async (medId, time, status) => {
    const key = `${medId}_${time}`;
    const updated = { ...doseLog };
    if (status === null) {
      delete updated[key];
    } else {
      updated[key] = status;
    }
    // Update UI + localStorage immediately
    setDoseLog(updated);
    saveDoseLog(userId, todayKey, updated);

    // Sync to backend
    try {
      if (status === null) {
        // Undo — delete from DB
        await apiFetch(
          `/doses.php?medicine_id=${medId}&time=${encodeURIComponent(time)}&date=${todayKey}&patient_id=${userId}`,
          { method: "DELETE" }
        );
      } else {
        // Mark taken or missed
        await apiFetch(`/doses.php?patient_id=${userId}`, {
          method: "POST",
          body: JSON.stringify({
            medicine_id: medId,
            scheduled_time: time,
            date: todayKey,
            status,
          }),
        });
      }
    } catch (e) {
      console.warn("Dose sync failed:", e.message);
      // Already saved to localStorage, so UI stays correct
    }
  };

  const getDoseStatus = (medId, time) => doseLog[`${medId}_${time}`] || null;

  const expired = meds.filter(m => m.expiry && new Date(m.expiry) < new Date());
  const expiring = meds.filter(m => { if (!m.expiry) return false; const d = (new Date(m.expiry) - new Date()) / 86400000; return d >= 0 && d < 30; });

  // ── Build today's schedule respecting frequency ─────────────────
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const nowStr = new Date().toTimeString().slice(0, 5);
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const isScheduledToday = (m) => {
    if (!m.times || m.times.length === 0) return false;
    const freq = (m.frequency || "").toLowerCase();
    if (freq === "as needed") return false; // never in daily schedule
    if (freq === "weekly") return dayOfWeek === 1; // Mondays only
    if (freq === "once daily") return true;
    if (freq === "twice daily") return true;
    if (freq === "three times daily") return true;
    if (freq.includes("every 8")) return true;
    if (freq.includes("every 12")) return true;
    return true; // any other frequency — show it
  };

  const times = meds
    .filter(isScheduledToday)
    .flatMap(m => (m.times || []).map(t => ({ med: m, time: t })))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Counts based on user actions, not clock
  const takenCount = times.filter(({ med, time }) => getDoseStatus(med.id, time) === "taken").length;
  const missedCount = times.filter(({ med, time }) => getDoseStatus(med.id, time) === "missed").length;
  const pendingCount = times.filter(({ med, time }) => !getDoseStatus(med.id, time)).length;

  return (
    <div className="cnt">
      <div className="dash-layout">

        {/* LEFT COLUMN — Hero + Reports + Widget grid */}
        <div className="dash-left">

          {/* Hero card */}
          <div className="hero">
            <div style={{ fontSize: 12, opacity: .75, letterSpacing: ".5px", textTransform: "uppercase", fontWeight: 500, marginBottom: 6 }}>Today</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600, opacity: .9 }}>{dateStr}</div>
            <div style={{ marginTop: 16, display: "flex", gap: 20 }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{pendingCount}</div>
                <div style={{ fontSize: 12, opacity: .75, marginTop: 3 }}>Upcoming doses</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,.2)" }} />
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{takenCount}</div>
                <div style={{ fontSize: 12, opacity: .75, marginTop: 3 }}>Taken</div>
              </div>
              {missedCount > 0 && <>
                <div style={{ width: 1, background: "rgba(255,255,255,.2)" }} />
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, lineHeight: 1, color: "#FCA5A5" }}>{missedCount}</div>
                  <div style={{ fontSize: 12, opacity: .75, marginTop: 3 }}>Missed</div>
                </div>
              </>}
            </div>
          </div>

          {/* Reports card — same width as hero */}
          {/* Reports widget */}
          <div className="w" onClick={onReports} style={{
            cursor: "pointer",
            background: "linear-gradient(135deg,#1E3A5F 0%,#2563EB 100%)",
            border: "none", color: "#fff",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "rgba(255,255,255,.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700 }}>Medication Reports</div>
                  <div style={{ fontSize: 11, opacity: .75, marginTop: 2 }}>Daily · Weekly · Monthly</div>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          </div>

          {/* Widget grid — 2 columns */}
          <div className="dash-widget-grid">
            {/* ── Active Medicines Widget ── */}
            {(() => {
              const activeMeds = meds.filter(m => expSt(m.expiry) !== "expired");
              const showViewAll = meds.length > 4;
              return (
                <div style={{
                  background: "var(--sf)", borderRadius: "var(--rd)",
                  boxShadow: "var(--sh)", overflow: "hidden",
                  border: "1.5px solid var(--bd)",
                }}>
                  {/* Header */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px 12px",
                    borderBottom: meds.length > 0 ? "1px solid var(--bd)" : "none",
                  }}>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--tx)" }}>
                        Active Medicines
                      </div>
                      <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>
                        {meds.length === 0
                          ? "No medicines added yet"
                          : `${activeMeds.length} medicine${activeMeds.length !== 1 ? "s" : ""} active`}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        background: "var(--gl)", borderRadius: 20, padding: "3px 10px",
                        fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: "var(--g)",
                      }}>{meds.length}</div>
                      {/* Hide arrow when "View all" footer is shown */}
                      {!showViewAll && (
                        <button onClick={onMeds} style={{
                          background: "none", border: "1.5px solid var(--bd)", borderRadius: 8,
                          width: 32, height: 32, cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center", color: "var(--t2)",
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {meds.length === 0 ? (
                    <div style={{ padding: "20px 16px", textAlign: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--gl)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "var(--g)" }}><Icons.pill /></div>
                      <div style={{ fontSize: 13, color: "var(--t3)" }}>Add your first medicine</div>
                      <button onClick={onMeds} style={{ marginTop: 10, padding: "7px 16px", borderRadius: 8, border: "none", background: "var(--g)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Medicine</button>
                    </div>
                  ) : (
                    <div>
                      {meds.slice(0, 4).map((m, i) => {
                        const st = expSt(m.expiry);
                        const isExp = st === "expired";
                        const isExpiring = st === "expiring";
                        const daysLeft = m.expiry ? Math.ceil((new Date(m.expiry) - new Date()) / 86400000) : null;
                        const accentBar = isExp ? "#DC2626" : isExpiring ? "#D97706" : "var(--g)";
                        const accentBg = isExp ? "linear-gradient(to right,#FEF2F2 0%,var(--sf) 55%)"
                          : isExpiring ? "linear-gradient(to right,#FFFBEB 0%,var(--sf) 55%)"
                            : "var(--sf)";
                        const rowBorder = i < Math.min(meds.length, 4) - 1 ? "1px solid var(--bd)" : "none";
                        return (
                          <div key={m.id} onClick={onMeds} style={{
                            display: "flex", alignItems: "stretch",
                            cursor: "pointer", background: accentBg,
                            borderBottom: rowBorder,
                            transition: "filter .15s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.filter = "brightness(.97)"}
                            onMouseLeave={e => e.currentTarget.style.filter = "none"}>
                            {/* Accent left bar — same as MedList cards */}
                            <div style={{ width: 4, flexShrink: 0, background: accentBar }} />
                            {/* Content */}
                            <div style={{ display: "flex", alignItems: "center", flex: 1, padding: "12px 14px", gap: 10, minWidth: 0 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700,
                                  color: isExp ? "#DC2626" : "var(--tx)",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>{m.name}</div>
                                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {m.dosage} {m.unit}
                                  {m.frequency ? ` · ${m.frequency}` : ""}
                                  {m.times?.length > 0 ? ` · ${m.times.map(t => fmt12(t)).join(", ")}` : ""}
                                </div>
                              </div>
                              <div style={{ flexShrink: 0 }}>
                                {isExp && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" }}>EXPIRED</span>}
                                {isExpiring && daysLeft !== null && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }}>{daysLeft}D LEFT</span>}
                                {!isExp && !isExpiring && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "var(--gl)", color: "var(--g)", border: "1px solid var(--gm)" }}>ACTIVE</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {showViewAll && (
                        <div onClick={onMeds} style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderTop: "1px solid var(--bd)", background: "var(--s2)", fontSize: 12, fontWeight: 700, color: "var(--g)" }}>
                          View all {meds.length} medicines
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Expiry Widget — sits beside Active Medicines in the grid */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className="w wg-exp" onClick={onExpiry}
                style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", cursor: "pointer", borderRadius: "var(--rd)", flex: 1 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 12px" }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: "#FFF7ED", color: "#C2410C",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icons.expire />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)", fontFamily: "'Syne',sans-serif" }}>Expiry Tracker</div>
                    <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>
                      {expired.length + expiring.length === 0
                        ? "All medicines are in date"
                        : `${expired.length + expiring.length} medicine${expired.length + expiring.length > 1 ? "s" : ""} need${expired.length + expiring.length === 1 ? "s" : ""} attention`}
                    </div>
                  </div>
                  <div style={{ color: "var(--t3)", display: "flex", flexShrink: 0 }}><Icons.chev /></div>
                </div>

                {/* Medicine rows — up to 2 most urgent, with progress bar */}
                {(expired.length > 0 || expiring.length > 0) ? (() => {
                  const urgentList = [
                    ...expired.sort((a, b) => new Date(a.expiry) - new Date(b.expiry)),
                    ...expiring.sort((a, b) => new Date(a.expiry) - new Date(b.expiry)),
                  ].slice(0, 2);

                  return (
                    <div style={{ borderTop: "1px solid var(--bd)", display: "flex", flexDirection: "column", flex: 1 }}>
                      {urgentList.map((m, i) => {
                        const isExp = expSt(m.expiry) === "expired";
                        const days = Math.ceil((new Date(m.expiry) - new Date()) / 86400000);
                        const accent = isExp ? "#EF4444" : days <= 7 ? "#F97316" : "#F59E0B";
                        const accentL = isExp ? "#FEE2E2" : days <= 7 ? "#FFEDD5" : "#FEF3C7";

                        const pct = isExp ? 0 : Math.min(100, Math.round((days / 30) * 100));

                        const label = isExp
                          ? "Expired"
                          : days === 0 ? "Expires today"
                            : days === 1 ? "Expiring tomorrow"
                              : `Expiring in ${days} day${days !== 1 ? "s" : ""}`;

                        return (
                          <div key={m.id} style={{
                            padding: "11px 16px 10px",
                            borderBottom: i < urgentList.length - 1 ? "1px solid var(--bd)" : "none",
                          }}>
                            {/* Top row: name (left) + status label (right) */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 3 }}>
                              {/* Medicine name — prominent */}
                              <div style={{
                                fontFamily: "'Syne',sans-serif",
                                fontWeight: 700, fontSize: 14,
                                color: "var(--tx)",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                flex: 1, minWidth: 0,
                                lineHeight: 1.3,
                              }}>
                                {m.name}
                              </div>
                              {/* Status */}
                              <div style={{
                                fontSize: 12, fontWeight: 700,
                                color: accent,
                                flexShrink: 0, whiteSpace: "nowrap",
                                lineHeight: 1.3,
                              }}>
                                {label}
                              </div>
                            </div>

                            {/* Sub-row: dosage + expiry date */}
                            <div style={{
                              fontSize: 11, color: "var(--t3)", fontWeight: 500,
                              marginBottom: 8,
                              display: "flex", alignItems: "center", gap: 6,
                            }}>
                              {m.dosage && m.unit && (
                                <span style={{
                                  background: "var(--s2)", borderRadius: 6,
                                  padding: "1px 7px", fontSize: 11, fontWeight: 600,
                                  color: "var(--t2)",
                                }}>
                                  {m.dosage} {m.unit}
                                </span>
                              )}
                              <span style={{ color: "var(--bd)" }}>·</span>
                              <span>Exp: {m.expiry}</span>
                            </div>

                            {/* Progress bar */}
                            <div style={{ height: 5, borderRadius: 99, background: accentL, overflow: "hidden" }}>
                              <div style={{
                                height: "100%",
                                width: `${pct}%`,
                                borderRadius: 99,
                                background: accent,
                                transition: "width .4s ease",
                                minWidth: isExp ? "0%" : "4%",
                              }} />
                            </div>
                          </div>
                        );
                      })}

                      {/* More footer */}
                      {(expired.length + expiring.length) > 2 && (
                        <div style={{
                          padding: "8px 16px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "var(--s2)",
                          borderTop: "1px solid var(--bd)",
                          marginTop: "auto",
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--g)" }}>
                            +{(expired.length + expiring.length) - 2} more · Tap to view all
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  /* All clear */
                  <div style={{
                    borderTop: "1px solid var(--bd)",
                    padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: "var(--gl)", color: "var(--g)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: 16,
                    }}>✅</div>
                    <div style={{ fontSize: 13, color: "var(--t2)" }}>
                      All medicines are within their expiry dates.
                    </div>
                  </div>
                )}
              </div>{/* end expiry widget */}
            </div>{/* end grid-span */}
          </div>{/* end dash-widget-grid */}

          {/* Compact Prescriptions strip */}
          <div onClick={onRx} style={{
            display: "flex", alignItems: "center", gap: 14,
            background: "var(--sf)", borderRadius: "var(--rd)",
            padding: "13px 16px", boxShadow: "var(--sh)",
            border: "1.5px solid #BFDBFE", cursor: "pointer",
            transition: "box-shadow .18s,transform .18s",
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--sh2)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--sh)"; e.currentTarget.style.transform = "none"; }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bl)", color: "var(--b)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icons.rx />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>Prescriptions</div>
              <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>Doctor documents</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "var(--b)" }}>{rx.length}</div>
              <div style={{
                fontSize: 11, fontWeight: 700, padding: "4px 12px",
                borderRadius: 20, background: "var(--bl)", color: "var(--b)",
                border: "1.5px solid #BFDBFE", whiteSpace: "nowrap",
              }}>View all →</div>
            </div>
          </div>

        </div>{/* end dash-left */}

        {/* RIGHT COLUMN — Summary + Today's Schedule */}
        <div className="dash-right">

          {/* Dose Status Summary Widget */}
          {times.length > 0 && (takenCount > 0 || missedCount > 0) && (
            <div style={{
              background: "var(--sf)", borderRadius: "var(--rd)", padding: "14px 16px",
              boxShadow: "var(--sh)", border: "1.5px solid var(--bd)", marginBottom: 4,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)", letterSpacing: ".4px", textTransform: "uppercase", marginBottom: 10 }}>
                Today's Summary
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {takenCount > 0 && (
                  <div style={{ flex: 1, background: "#F0FDF4", borderRadius: 10, padding: "10px 12px", border: "1.5px solid #BBF7D0" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#16A34A", fontFamily: "'Syne',sans-serif" }}>{takenCount}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", marginTop: 2 }}>✓ Taken</div>
                  </div>
                )}
                {missedCount > 0 && (
                  <div style={{ flex: 1, background: "#FEF2F2", borderRadius: 10, padding: "10px 12px", border: "1.5px solid #FECACA" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#DC2626", fontFamily: "'Syne',sans-serif" }}>{missedCount}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", marginTop: 2 }}>✗ Missed</div>
                  </div>
                )}
                {pendingCount > 0 && (
                  <div style={{ flex: 1, background: "var(--s2)", borderRadius: 10, padding: "10px 12px", border: "1.5px solid var(--bd)" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--t2)", fontFamily: "'Syne',sans-serif" }}>{pendingCount}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", marginTop: 2 }}>⏳ Pending</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Today's Schedule */}
          <div>
            <div className="sh"><div className="st">Today's Schedule</div></div>
            {times.length === 0 && (
              <div className="empty" style={{ padding: "24px 0" }}>
                <Icons.clock />
                <p>No medicines scheduled for today.</p>
              </div>
            )}
            {times.map(({ med, time }, i) => {
              const status = getDoseStatus(med.id, time);
              const isTaken = status === "taken";
              const isMissed = status === "missed";
              const isPast = time < nowStr;
              return (
                <div key={`${med.id}_${time}`} className="sc" style={{
                  opacity: isMissed ? .65 : 1,
                  borderLeft: isTaken ? "3px solid #16A34A" : isMissed ? "3px solid #DC2626" : "3px solid transparent",
                  transition: "all .2s",
                }}>
                  {/* Medicine icon */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    background: isTaken ? "#F0FDF4" : isMissed ? "#FEF2F2" : isPast ? "var(--s2)" : "var(--gl)",
                  }}>
                    {isTaken ? "✅" : isMissed ? "❌" : "💊"}
                  </div>

                  {/* Name + dosage */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 15,
                      textDecoration: isMissed ? "line-through" : "none",
                      color: isMissed ? "var(--t3)" : "var(--tx)",
                    }}>{med.name}</div>
                    <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span>{med.dosage} {med.unit}</span>
                      <span style={{ color: "var(--bd)" }}>·</span>
                      <span style={{
                        background: "var(--s2)", borderRadius: 5, padding: "1px 6px",
                        fontSize: 10, fontWeight: 600, color: "var(--t2)",
                      }}>{med.frequency}</span>
                    </div>
                  </div>

                  {/* Time + action buttons */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <div style={{
                      fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13,
                      color: isTaken ? "#16A34A" : isMissed ? "#DC2626" : isPast ? "var(--a)" : "var(--g)",
                    }}>
                      {fmt12(time)}
                    </div>
                    {/* Action buttons — always shown */}
                    {!status ? (
                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          onClick={() => markDose(med.id, time, "taken")}
                          style={{
                            padding: "4px 10px", borderRadius: 7, border: "1.5px solid #16A34A",
                            background: "#F0FDF4", color: "#16A34A", fontSize: 11, fontWeight: 700,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}>✓ Taken</button>
                        <button
                          onClick={() => markDose(med.id, time, "missed")}
                          style={{
                            padding: "4px 10px", borderRadius: 7, border: "1.5px solid #FECACA",
                            background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 700,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}>✗ Missed</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => markDose(med.id, time, null)}
                        style={{
                          padding: "3px 9px", borderRadius: 7, border: "1.5px solid var(--bd)",
                          background: "var(--s2)", color: "var(--t3)", fontSize: 10, fontWeight: 600,
                          cursor: "pointer",
                        }}>Undo</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>{/* end dash-right */}

      </div>{/* end dash-layout */}
    </div>
  );
}
