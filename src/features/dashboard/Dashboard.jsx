import { useState, useEffect } from "react";
import { Icons } from "../../components/icons/Icons";
import { getMeds, saveMeds, getRx, saveRx, getDoseLog, saveDoseLog } from "../../services/storage";
import { apiFetch } from "../../services/api";
import { fmt12 } from "../../utils/formatters";
import { mapMed } from "../../utils/mappers";
// Removed DatePickerModal import to use native browser picker

export function Dashboard({ userId, onMeds, onRx, onExpiry, onReports }) {
  const [meds, setMeds] = useState(() => getMeds(userId));
  const [rxList, setRx] = useState(() => getRx(userId));
  const [selDate, setSelDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Load fresh data from backend on mount
  useEffect(() => {
    apiFetch(`/medicines.php?patient_id=${userId}`)
      .then(data => {
        const mapped = data.map(mapMed);
        setMeds(mapped);
        saveMeds(userId, mapped);
      })
      .catch(() => { });

    apiFetch(`/prescriptions.php?patient_id=${userId}`)
      .then(data => {
        setRx(data);
        saveRx(userId, data);
      })
      .catch(() => { });
  }, [userId]);

  // ── Dose log: stored per date locally + synced to backend ──────
  const [doseLog, setDoseLog] = useState(() => getDoseLog(userId, selDate));

  useEffect(() => {
    apiFetch(`/doses.php?patient_id=${userId}&date=${selDate}`)
      .then(data => {
        setDoseLog(data);
        saveDoseLog(userId, selDate, data);
      })
      .catch(() => { });
  }, [userId, selDate]);

  const markDose = async (medId, time, status) => {
    if (isFutureDate) return; // Prevent marking doses for future dates
    const key = `${medId}_${time}`;
    const updated = { ...doseLog };
    if (status === null) {
      delete updated[key];
    } else {
      updated[key] = status;
    }
    setDoseLog(updated);
    saveDoseLog(userId, selDate, updated);

    try {
      if (status === null) {
        await apiFetch(
          `/doses.php?medicine_id=${medId}&time=${encodeURIComponent(time)}&date=${selDate}&patient_id=${userId}`,
          { method: "DELETE" }
        );
      } else {
        // Use /doses.php endpoint with patient_id in query
        await apiFetch(`/doses.php?patient_id=${userId}`, {
          method: "POST",
          body: JSON.stringify({
            medicine_id: medId,
            scheduled_time: time,
            date: selDate,
            status,
          }),
        });
      }
    } catch (e) {
      console.warn("Dose sync failed:", e.message);
    }
  };

  const getDoseStatus = (medId, time) => doseLog[`${medId}_${time}`] || null;

  const expired = meds.filter(m => m.expiry && new Date(m.expiry) < new Date());
  const expiring = meds.filter(m => { 
    if (!m.expiry) return false; 
    const d = (new Date(m.expiry) - new Date()) / 86400000; 
    return d >= 0 && d < 30; 
  });

  const selD = new Date(selDate);
  const selDayOfWeek = selD.getDay();
  const nowStr = new Date().toTimeString().slice(0, 5);
  const isToday = selDate === new Date().toISOString().split("T")[0];

  const isScheduledOn = (m) => {
    if (!m.times || m.times.length === 0) return false;
    const freq = (m.frequency || "").toLowerCase();
    if (freq === "as needed") return false;
    if (freq === "weekly") return selDayOfWeek === 1;
    if (freq === "once daily") return true;
    if (freq === "twice daily") return true;
    if (freq === "three times daily") return true;
    if (freq.includes("every 8")) return true;
    if (freq.includes("every 12")) return true;
    return true;
  };

  const times = meds
    .filter(isScheduledOn)
    .flatMap(m => (m.times || []).map(t => ({ med: m, time: t })))
    .sort((a, b) => a.time.localeCompare(b.time));

  const takenCount = times.filter(({ med, time }) => getDoseStatus(med.id, time) === "taken").length;
  const totalCount = times.length;
  const pendingCount = totalCount - takenCount;

  // Weekly progress dots - simplified: show status for the last 7 days (including today)
  const getWeeklyStats = () => {
    const dots = [];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    let totalWeekDoses = 0;
    let takenWeekDoses = 0;
    
    const first = new Date(today);
    const day = today.getDay();
    first.setDate(today.getDate() - day);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      const ds = d.toISOString().split("T")[0];
      const isPastOrToday = ds <= todayStr;
      
      const log = ds === selDate ? doseLog : getDoseLog(userId, ds);
      const dayMeds = meds.filter(m => {
        const dow = d.getDay();
        const freq = (m.frequency || "").toLowerCase();
        if (freq === "as needed") return false;
        if (freq === "weekly") return dow === 1;
        return true; 
      });
      
      const dayTotal = dayMeds.reduce((acc, m) => acc + (m.times?.length || 0), 0);
      
      if (isPastOrToday) {
        totalWeekDoses += dayTotal;
        const dayTaken = Object.keys(log).filter(k => log[k] === "taken").length;
        takenWeekDoses += dayTaken;

        if (dayTotal === 0) {
          dots.push({ bg: "var(--bd)", label: d.toLocaleDateString("en-US", { weekday: "narrow" }) });
        } else {
          const color = dayTaken >= dayTotal ? "var(--g)" : dayTaken > 0 ? "var(--a)" : "var(--bd)";
          dots.push({ bg: color, label: d.toLocaleDateString("en-US", { weekday: "narrow" }) });
        }
      } else {
        dots.push({ bg: "var(--bd)", label: d.toLocaleDateString("en-US", { weekday: "narrow" }) });
      }
    }
    
    const average = totalWeekDoses > 0 ? Math.round((takenWeekDoses / totalWeekDoses) * 100) : 100;
    return { dots, average };
  };

  const { dots: weekDots, average: weeklyAdherence } = getWeeklyStats();

  const getNextDoseInMeds = (m) => {
    if (!m.times || m.times.length === 0) return null;
    const sorted = [...m.times].sort();
    const next = sorted.find(t => t > nowStr);
    return next || sorted[0];
  };

  const handleQuickRx = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", `Upload ${new Date().toLocaleDateString()}`);
    if (userId) formData.append("patient_id", userId);

    try {
      const res = await apiFetch("/prescriptions.php", { method: "POST", body: formData, isMultipart: true });
      if (res) onRx(); // Go to Rx tab to see the result
    } catch (err) {
      console.error("Quick Rx failed:", err);
    }
  };


  const pendingDoses = times.filter(({ med, time }) => !getDoseStatus(med.id, time));
  const nextDose = pendingDoses[0];

  const todayStr = new Date().toISOString().split("T")[0];
  const isFutureDate = selDate > todayStr;
  const shiftMonth = (delta) => {
    const d = new Date(selDate);
    d.setMonth(d.getMonth() + delta);
    setSelDate(d.toISOString().split("T")[0]);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selDate);
    // Find Sunday of the week containing selDate
    const day = d.getDay();
    d.setDate(d.getDate() - day + i);
    return d;
  });

  return (
    <div className="cnt">
      <div className="dash-layout">

        {/* LEFT COLUMN — Main Tasks & Schedule */}
        <div className="dash-left">

          {/* Hero Card */}
          <div className="hero">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, opacity: .8, letterSpacing: ".8px", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>
                  {isToday ? "Today" : selD.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800 }}>
                  {isToday ? "Daily Progress" : "Schedule Summary"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, padding: "4px 10px", background: "rgba(0,0,0,.1)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{takenCount} <span style={{ opacity: .7, fontWeight: 400 }}>Taken</span></div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{pendingCount} <span style={{ opacity: .7, fontWeight: 400 }}>Left</span></div>
              </div>
            </div>

            {nextDose && isToday ? (
              <div style={{
                background: "rgba(255,255,255,.12)", borderRadius: 14, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 12, animation: "fadeUp .4s ease",
                border: "1px solid rgba(255,255,255,.08)"
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💊</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 10, opacity: .8, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Next Dose</div>
                    <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#fff", opacity: .4 }} />
                    <div style={{ fontSize: 10, fontWeight: 600, opacity: .8 }}>{nextDose.med.dosage} {nextDose.med.unit}</div>
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nextDose.med.name}</div>
                </div>
                <div style={{ background: "#fff", color: "var(--g)", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: "'Syne',sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>{fmt12(nextDose.time)}</div>
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 14, padding: "16px 18px", textAlign: "center", border: "1.5px dashed rgba(255,255,255,.15)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>
                  {isToday ? "🎉 All caught up for today!" : `📅 Viewing ${selD.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`}
                </div>
              </div>
            )}
          </div>

          {/* Calendar Strip Header */}
          <div className="cal-strip-hd">
            <button className="cal-date-sel" onClick={() => document.getElementById("native-date").showPicker()}>
              <span className="cal-month">{selD.toLocaleDateString("en-US", { month: "long" })}</span>
              <span className="cal-year">{selD.getFullYear()}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              {/* Native Date Input Hidden */}
              <input 
                id="native-date"
                type="date" 
                value={selDate} 
                max={todayStr}
                onChange={(e) => setSelDate(e.target.value)}
                style={{ visibility: "hidden", position: "absolute", width: 0, height: 0 }}
              />
            </button>
            <div className="cal-nav">
              <button className="cal-nav-btn" onClick={() => shiftMonth(-1)} title="Previous Month">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button className="cal-nav-btn" onClick={() => shiftMonth(1)} title="Next Month"
                disabled={new Date(selD.getFullYear(), selD.getMonth() + 1, 1) > new Date()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Weekly Calendar Strip */}
          <div className="cal-strip-container">
            {weekDays.map(d => {
              const iso = d.toISOString().split("T")[0];
              const isSel = iso === selDate;
              const isTd = iso === new Date().toISOString().split("T")[0];
              return (
                <div key={iso} 
                  onClick={() => iso <= todayStr && setSelDate(iso)} 
                  className={`cal-item${isSel ? " sel" : ""}${isTd ? " today" : ""}${iso > todayStr ? " disabled" : ""}`}>
                  <div className="cal-item-day">{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                  <div className="cal-item-date">{d.getDate()}</div>
                  {isTd && !isSel && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--g)" }} />}
                </div>
              );
            })}
          </div>



          {/* Medication Schedule */}
          <div style={{ animation: "fadeUp .4s ease .2s both", marginBottom: 20 }}>
            <div className="sh" style={{ marginBottom: 14 }}>
              <div className="st">
                {isToday ? "Today's Schedule" : `${selD.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })} Schedule`}
              </div>
            </div>
            {times.length === 0 ? (
              <div className="empty" style={{ padding: "30px 20px", textAlign: "center", background: "var(--sf)", backdropFilter: "blur(10px)", borderRadius: "var(--rd)", border: "1.5px dashed var(--bd)" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>🍃</div>
                <div style={{ fontSize: 13, color: "var(--t3)", fontWeight: 500 }}>No medicines scheduled for this day.</div>
              </div>
            ) : (
              times.map(({ med, time }) => {
                const status = getDoseStatus(med.id, time);
                const isTaken = status === "taken";
                const isMissed = status === "missed";
                const medColor = med.pillColor || "var(--g)";
                const Icon = Icons[med.typeIcon] || Icons.pill;
                
                return (
                  <div key={`${med.id}_${time}`} className="sc" style={{
                    opacity: isMissed ? .65 : 1, transition: "all .2s", padding: "10px 14px", marginBottom: 8,
                    borderLeft: `4px solid ${isTaken ? "#16A34A" : isMissed ? "#DC2626" : medColor}`,
                    background: isTaken ? "rgba(22, 163, 74, 0.03)" : "var(--sf)"
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isTaken ? "#F0FDF4" : isMissed ? "#FEF2F2" : `${medColor}20`,
                      color: isTaken ? "#16A34A" : isMissed ? "#DC2626" : medColor,
                      boxShadow: !isTaken && !isMissed ? `0 4px 12px ${medColor}15` : "none"
                    }}>
                      {isTaken ? "✅" : isMissed ? "❌" : <Icon s={20} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, textDecoration: isMissed ? "line-through" : "none", color: isMissed ? "var(--t3)" : "var(--tx)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{med.name}</div>
                      <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>{med.dosage} {med.unit} · <span style={{ color: "var(--t2)", fontWeight: 600 }}>{med.frequency}</span></div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12, color: isTaken ? "#16A34A" : isMissed ? "#DC2626" : "var(--g)" }}>{fmt12(time)}</div>
                      {!status && !isFutureDate ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => markDose(med.id, time, "taken")} style={{ padding: "3px 8px", borderRadius: 6, border: "1.5px solid #16A34A", background: "#F0FDF4", color: "#16A34A", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Take</button>
                          <button onClick={() => markDose(med.id, time, "missed")} style={{ padding: "3px 8px", borderRadius: 6, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Skip</button>
                        </div>
                      ) : status ? (
                        <button onClick={() => markDose(med.id, time, null)} style={{ background: "none", border: "1.5px solid var(--bd)", padding: "1px 6px", borderRadius: 5, color: "var(--t3)", fontSize: 9, fontWeight: 600, cursor: "pointer" }}>Undo</button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>{/* end dash-left */}

        {/* RIGHT COLUMN — Secondary Widgets */}
        <div className="dash-right">

          {/* Reports widget */}
          <div className="w glass-card" onClick={onReports} style={{ border: "none", marginBottom: 16, overflow: "hidden", padding: 0 }}>
            <div style={{ background: "linear-gradient(135deg,#1E3A5F 0%,#2563EB 100%)", padding: 18, color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icons.reports />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700 }}>Health Reports</div>
                    <div style={{ fontSize: 11, opacity: .75 }}>Analysis & Trends</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>{weeklyAdherence}%</div>
                  <div style={{ fontSize: 9, opacity: .8, fontWeight: 600 }}>WEEKLY AVG</div>
                </div>
              </div>
            </div>
            <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "var(--t2)" }}>
              <span>Weekly Progress</span>
              <div style={{ display: "flex", gap: 4 }}>
                {weekDots.map((dot, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: dot.bg, border: dot.bg === "var(--bd)" ? "1px solid rgba(0,0,0,0.05)" : "none" }} />
                ))}
              </div>
            </div>
          </div>

          <div className="dash-widget-grid" style={{ gap: 12, marginBottom: 16 }}>
            {/* Active Meds simplified widget */}
            <div className="glass-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--bd)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700 }}>Active Meds</div>
                <div style={{ background: "var(--gl)", borderRadius: 12, padding: "1px 6px", fontSize: 10, fontWeight: 800, color: "var(--g)" }}>{meds.length}</div>
              </div>
              {meds.length === 0 ? (
                <div style={{ padding: "12px", textAlign: "center", fontSize: 11, color: "var(--t3)" }}>No items</div>
              ) : (
                meds.slice(0, 3).map((m, i) => {
                  const nextTime = getNextDoseInMeds(m);
                  const isLow = m.quantity && parseFloat(m.quantity) <= 10;
                  return (
                    <div key={m.id} onClick={onMeds} style={{ display: "flex", alignItems: "center", padding: "8px 12px", gap: 10, borderBottom: i < Math.min(meds.length, 3) - 1 ? "1px solid var(--bd)" : "none", cursor: "pointer" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                          {isLow && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--r)" }} title="Low Stock" />}
                        </div>
                        <div style={{ fontSize: 9, color: "var(--t3)", display: "flex", justifyContent: "space-between" }}>
                          <span>{m.dosage} {m.unit}</span>
                          {nextTime && <span style={{ color: "var(--g)", fontWeight: 700 }}>Next: {fmt12(nextTime)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Expiry simplified widget */}
            <div onClick={onExpiry} className="glass-card" style={{ padding: "10px 12px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, background: "#FFF7ED", color: "#C2410C", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.expire /></div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700 }}>Expiry Tracker</div>
              </div>
              
              <div style={{ marginTop: 2 }}>
                <div className="exp-bar">
                  <div className="exp-seg red" style={{ width: `${(expired.length / (meds.length || 1)) * 100}%` }} />
                  <div className="exp-seg amb" style={{ width: `${(expiring.length / (meds.length || 1)) * 100}%` }} />
                  <div className="exp-seg grn" style={{ flex: 1 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 700, marginTop: 4 }}>
                  <span style={{ color: expired.length > 0 ? "var(--r)" : "var(--t3)" }}>{expired.length} Expired</span>
                  <span style={{ color: expiring.length > 0 ? "var(--a)" : "var(--t3)" }}>{expiring.length} Soon</span>
                </div>
              </div>
            </div>
          </div>

          {/* Prescriptions strip */}
          <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", overflow: "hidden" }}>
            <div onClick={onRx} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bl)", color: "var(--b)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.rx /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700 }}>Prescriptions</div>
                <div style={{ fontSize: 10, color: "var(--t3)" }}>{rxList[rxList.length - 1]?.title || `${rxList.length} documents`}</div>
              </div>
            </div>
            <label style={{ width: 32, height: 32, borderRadius: 8, background: "var(--s2)", border: "1.5px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--g)" }}>
              <Icons.plus />
              <input type="file" style={{ display: "none" }} onChange={handleQuickRx} accept="image/*,.pdf" />
            </label>
          </div>

          </div>{/* end dash-right */}

          {/* Custom DatePickerModal removed as per user request to use native browser picker */}

        </div>{/* end dash-layout */}
    </div>
  );
}
