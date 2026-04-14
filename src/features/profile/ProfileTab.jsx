import { useState, useEffect } from "react";
import { Icons } from "../../components/icons/Icons";
import { SvgI } from "../../components/icons/Icons";
import { Slide } from "../../components/common/Slide";
import {
  getRx, saveRx,
  getCaretakerRels, saveCaretakerRels,
  getPatientRels, savePatientRels,
  getInvites, saveInvites,
  getHideEmail, saveHideEmail,
} from "../../services/storage";
import { apiFetch } from "../../services/api";
import { mapRx } from "../../utils/mappers";
import { PdfThumb } from "../prescriptions/PdfHelpers";
import { AccountDetailsSlide } from "./AccountDetailsSlide";
import { SettingsSlide } from "./SettingsSlide";

export function ProfileTab({ user, userId, onLogout, onOpenRx, onSwitchPatient, activePatient, onBack }) {
  const [rxList, setRxList] = useState(() => getRx(userId));
  const [inner, setInner] = useState(null);

  // Load prescriptions from backend so the count is fresh
  useEffect(() => {
    apiFetch(`/prescriptions.php?patient_id=${userId}`)
      .then(data => {
        const mapped = data.map(mapRx);
        setRxList(mapped);
        saveRx(userId, mapped);
      })
      .catch(() => { }); // offline — already using localStorage
  }, [userId]);

  // ── Caretaker feature state ──────────────────────────────────
  const [inviteCode, setInviteCode] = useState("");
  const [inviteExpiry, setInviteExpiry] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteOffline, setInviteOffline] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [linkMsg, setLinkMsg] = useState({ text: "", ok: true });
  const [linkLoading, setLinkLoading] = useState(false);
  const [caretakers, setCaretakers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const isCaretaker = user.role === "Caretaker";

  // ── Load patients/caretakers from backend ────────────────────
  const loadRelationships = async () => {
    setListLoading(true);
    try {
      if (isCaretaker) {
        const data = await apiFetch("/caretaker.php?action=my_patients");
        setPatients(data || []);
      } else {
        const data = await apiFetch("/caretaker.php?action=my_caretakers");
        setCaretakers(data || []);
      }
    } catch {
      // Backend offline — load from localStorage
      const rels = getCaretakerRels();
      if (isCaretaker) {
        setPatients(rels.filter(r => r.caretaker_id === userId)
          .map(r => ({ id: r.patient_id, name: r.patient_name, email: "" })));
      } else {
        setCaretakers(rels.filter(r => r.patient_id === userId)
          .map(r => ({ id: r.caretaker_id, name: r.caretaker_name, email: "" })));
      }
    }
    setListLoading(false);
  };

  const openCaretaker = () => {
    setInviteOffline(false);
    setInviteCode("");
    setLinkCode("");
    setLinkMsg({ text: "", ok: true });
    setInner("caretaker");
    loadRelationships();
  };

  // ── PATIENT: Generate invite code ────────────────────────────
  const generateInvite = async () => {
    setInviteLoading(true);
    setInviteCode("");
    setInviteExpiry("");
    setInviteOffline(false);
    try {
      const data = await apiFetch("/caretaker.php?action=generate_invite", { method: "POST" });
      setInviteCode(data.code);
      setInviteExpiry(data.expires_at);
    } catch {
      // Backend offline — generate local code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString();
      // Save to localStorage so caretaker can pick it up on same device
      const existing = getInvites()
        .filter(i => i.patient_id !== userId); // clear old ones for this patient
      existing.push({ code, patient_id: userId, patient_name: user.name, expiry, used: false });
      saveInvites(existing);
      setInviteCode(code);
      setInviteExpiry(expiry);
      setInviteOffline(true);
    }
    setInviteLoading(false);
  };

  // ── CARETAKER: Accept invite code ────────────────────────────
  const acceptInvite = async () => {
    const code = linkCode.trim().toUpperCase();
    if (!code) return;
    setLinkLoading(true);
    setLinkMsg({ text: "", ok: true });
    try {
      // Try backend
      const data = await apiFetch("/caretaker.php?action=accept_invite", {
        method: "POST",
        body: JSON.stringify({ token: code }),
      });
      setLinkMsg({ text: `✓ Linked to ${data.patient.name}`, ok: true });
      setLinkCode("");
      await loadRelationships();
    } catch (apiErr) {
      // Backend offline — check localStorage invites
      const invites = getInvites();
      const invite = invites.find(i => i.code === code && !i.used);
      if (invite) {
        // Mark code as used
        saveInvites(invites.map(i => i.code === code ? { ...i, used: true } : i));
        // Save relationship in localStorage on caretaker's side
        const rels = getCaretakerRels();
        if (!rels.find(r => r.patient_id === invite.patient_id && r.caretaker_id === userId)) {
          rels.push({
            patient_id: invite.patient_id,
            patient_name: invite.patient_name,
            caretaker_id: userId,
            caretaker_name: user.name,
          });
          saveCaretakerRels(rels);
        }
        // Also save on patient's side so patient can see their caretakers
        const patRels = getPatientRels(invite.patient_id);
        if (!patRels.find(r => r.caretaker_id === userId)) {
          patRels.push({ caretaker_id: userId, caretaker_name: user.name });
          savePatientRels(invite.patient_id, patRels);
        }
        setLinkMsg({ text: `✓ Linked to ${invite.patient_name} (offline mode)`, ok: true });
        setLinkCode("");
        await loadRelationships();
      } else {
        const reason = apiErr.message.includes("expired") || apiErr.message.includes("Invalid")
          ? apiErr.message
          : "Code not found. Make sure you typed it correctly, or ask the patient to generate a new code.";
        setLinkMsg({ text: `✗ ${reason}`, ok: false });
      }
    }
    setLinkLoading(false);
  };

  // ── PATIENT: Revoke caretaker ─────────────────────────────────
  const revokeCaretaker = async (caretakerId, name) => {
    if (!confirm(`Remove ${name} as your caretaker?`)) return;
    try {
      await apiFetch("/caretaker.php?action=revoke", {
        method: "POST",
        body: JSON.stringify({ caretaker_id: caretakerId }),
      });
    } catch {
      const rels = getCaretakerRels();
      saveCaretakerRels(
        rels.filter(r => !(r.patient_id === userId && r.caretaker_id === caretakerId))
      );
    }
    setCaretakers(c => c.filter(x => x.id !== caretakerId));
  };

  // Email masking
  const [emailHidden, setEmailHidden] = useState(
    () => getHideEmail(userId)
  );
  const toggleEmail = (e) => {
    e.stopPropagation();
    setEmailHidden(h => {
      saveHideEmail(userId, h);
      return !h;
    });
  };
  const maskedEmail = (() => {
    const [local, domain] = user.email.split("@");
    return local.slice(0, 2) + "•".repeat(Math.max(local.length - 2, 3)) + "@" + domain;
  })();

  if (inner === "account") {
    return <AccountDetailsSlide user={user} onBack={() => setInner("settings")} />;
  }

  if (inner === "caretaker") {
    return (
      <Slide title={isCaretaker ? "My Patients" : "Caretaker Access"} onBack={() => setInner(null)}>

        {/* ── CARETAKER: link to a patient ── */}
        {isCaretaker && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>
                Link to a Patient
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={linkCode}
                  onChange={e => setLinkCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-char code e.g. A3F9B2"
                  maxLength={6}
                  style={{ flex: 1, padding: "11px 14px", border: "1.5px solid var(--bd)", borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "var(--g)"}
                  onBlur={e => e.target.style.borderColor = "var(--bd)"}
                />
                <button className="btn btn-p" style={{ width: "auto", padding: "0 18px", flexShrink: 0 }} onClick={acceptInvite} disabled={linkLoading}>
                  {linkLoading ? "…" : "Link"}
                </button>
              </div>
              {linkMsg.text && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: linkMsg.ok ? "var(--g)" : "var(--r)" }}>
                  {linkMsg.text}
                </div>
              )}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>
              Linked Patients
            </div>
            {listLoading ? (
              <div style={{ color: "var(--t3)", fontSize: 14, padding: "12px 0" }}>Loading…</div>
            ) : patients.length === 0 ? (
              <div style={{ color: "var(--t3)", fontSize: 13, padding: "12px 0" }}>No patients linked yet.</div>
            ) : (
              <div className="ib" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
                {patients.map(p => (
                  <div key={p.id} className="ir" style={{ cursor: "pointer", background: "var(--sf)", backdropFilter: "blur(10px)", borderRadius: 12, marginBottom: 8, border: "1px solid var(--bd)" }} onClick={() => { onSwitchPatient(p); setInner(null); }}>
                    <div className="il" style={{ flex: 1 }}>
                      <div className="ii" style={{ background: "var(--gl)", color: "var(--g)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>
                        {(p.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>{p.name || "Unknown"}</div>
                        <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{p.email || ""}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {activePatient?.id === p.id && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: "var(--gl)", color: "var(--g)", borderRadius: 20, padding: "2px 10px" }}>Active</span>
                      )}
                      <Icons.chev />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activePatient && (
              <button className="btn btn-o" style={{ marginTop: 16 }} onClick={() => { onSwitchPatient(null); setInner(null); }}>
                ← Switch back to my account
              </button>
            )}
          </>
        )}

        {/* ── PATIENT: generate invite + manage caretakers ── */}
        {!isCaretaker && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>
                Invite a Caretaker
              </div>
              <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: 12, lineHeight: 1.6 }}>
                Generate a one-time code and share it with your caretaker. The code expires in 24 hours.
              </p>
              <button className="btn btn-p" style={{ width: "auto" }} onClick={generateInvite} disabled={inviteLoading}>
                {inviteLoading ? "Generating…" : "Generate Code"}
              </button>
              {inviteCode && (
                <div style={{ marginTop: 14, background: "var(--gl)", borderRadius: 14, padding: "16px 18px", border: "1.5px solid var(--gm)" }}>
                  {inviteOffline && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#92400E", background: "var(--al)", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>
                      ⚠️ Backend offline — local demo code. Works on this device only.
                    </div>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--g)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>
                    Share this code
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, color: "var(--g)", letterSpacing: 6, wordBreak: "break-all" }}>
                    {inviteCode}
                  </div>
                  {inviteExpiry && (
                    <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 6 }}>
                      Expires: {inviteExpiry}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>
              My Caretakers
            </div>
            {listLoading ? (
              <div style={{ color: "var(--t3)", fontSize: 14, padding: "12px 0" }}>Loading…</div>
            ) : caretakers.length === 0 ? (
              <div style={{ color: "var(--t3)", fontSize: 13, padding: "12px 0" }}>No caretakers linked yet.</div>
            ) : (
              <div className="ib" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
                {caretakers.map(c => (
                  <div key={c.id} className="ir" style={{ background: "var(--sf)", backdropFilter: "blur(10px)", borderRadius: 12, marginBottom: 8, border: "1px solid var(--bd)" }}>
                    <div className="il" style={{ flex: 1 }}>
                      <div className="ii" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>
                        {(c.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>{c.name || "Unknown"}</div>
                        <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>
                          {c.linked_since ? "Linked " + String(c.linked_since).split("T")[0] : "Linked"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeCaretaker(c.id, c.name)}
                      style={{ padding: "5px 12px", borderRadius: 8, border: "1.5px solid var(--rl)", background: "var(--rl)", color: "var(--r)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Slide>
    );
  }

  if (inner === "settings") {
    return (
      <SettingsSlide
        onBack={() => setInner(null)}
        onAccountDetails={() => setInner("account")}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div className="cnt">
      <div className="page-hd">
        {onBack && (
          <button className="page-bk" onClick={onBack} title="Go back">
            <Icons.back />
          </button>
        )}
        <h2 className="pt" style={{ marginBottom: 0 }}>Profile</h2>
      </div>

      {/* Avatar banner */}
      <div className="pb">
        <div className="av">{user.name[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700 }}>{user.name}</div>

          {/* Email row with eye toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
            <div style={{
              fontSize: 13, opacity: .9,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              letterSpacing: emailHidden ? ".05em" : "normal",
              transition: "all .2s",
              maxWidth: "calc(100% - 28px)",
            }}>
              {emailHidden ? maskedEmail : user.email}
            </div>
            <button
              onClick={toggleEmail}
              title={emailHidden ? "Show email" : "Hide email"}
              style={{
                background: "rgba(255,255,255,.18)",
                border: "none",
                borderRadius: 6,
                width: 24, height: 24,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                color: "rgba(255,255,255,.85)",
                flexShrink: 0,
                transition: "background .15s",
                padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.28)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.18)"}
            >
              {emailHidden
                ? /* eye-off / slashed */ (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )
                : /* eye open */ (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )
              }
            </button>
          </div>

          <div style={{ fontSize: 11, marginTop: 6, background: "rgba(255,255,255,.2)", display: "inline-block", padding: "2px 10px", borderRadius: 20, fontWeight: 500 }}>{user.role}</div>
        </div>
      </div>

      {/* Prescription widget */}
      <div className="rx-w" onClick={onOpenRx}>
        <div className="rx-w-hd">
          <div className="rx-w-ic"><Icons.rx /></div>
          <div className="rx-w-inf">
            <div className="rx-w-ti">My Prescriptions</div>
            <div className="rx-w-su">{rxList.length === 0 ? "Tap to upload & manage" : rxList.length === 1 ? "1 prescription stored" : `${rxList.length} prescriptions stored`}</div>
          </div>
          <div className="rx-w-ch"><Icons.chev /></div>
        </div>
        {rxList.length > 0 && (
          <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
            {rxList.slice(0, 3).map(rx => {
              const isImg = rx.type?.includes("image");
              const isPdf = rx.type?.includes("pdf");
              const tag = isPdf ? { label: "PDF", bg: "#FEE2E2", col: "#DC2626" }
                : isImg ? { label: "IMG", bg: "#EFF6FF", col: "#2563EB" }
                  : { label: "FILE", bg: "var(--s2)", col: "var(--t2)" };
              const title = rx.title || rx.name;
              return (
                <div key={rx.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: tag.bg, color: tag.col, flexShrink: 0 }}>{tag.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--tx)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{title}</span>
                </div>
              );
            })}
            {rxList.length > 3 && (
              <div style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500 }}>+{rxList.length - 3} more</div>
            )}
          </div>
        )}
      </div>

      {/* Active patient banner — shown when caretaker is viewing a patient */}
      {activePatient && (
        <div style={{
          background: "linear-gradient(135deg,#1D4ED8,#3B82F6)",
          borderRadius: 14, padding: "12px 16px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 10, color: "#fff",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, opacity: .8 }}>Viewing as Caretaker for</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{activePatient.name}</div>
          </div>
          <button onClick={() => onSwitchPatient(null)} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, color: "#fff", padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Exit
          </button>
        </div>
      )}

      {/* Menu rows */}
      <div className="ib" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
        {/* Caretaker / Patient access row */}
        <div className="ir" style={{ cursor: "pointer", background: "var(--sf)", backdropFilter: "blur(10px)", borderRadius: 14, marginBottom: 8, border: "1px solid var(--bd)" }} onClick={openCaretaker}>
          <div className="il" style={{ flex: 1 }}>
            <div className="ii" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>
                {isCaretaker ? "My Patients" : "Caretaker Access"}
              </div>
              <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>
                {isCaretaker ? "View and manage your patients" : "Invite or manage caretakers"}
              </div>
            </div>
          </div>
          <Icons.chev />
        </div>

        {/* Settings row */}
        <div className="ir" style={{ cursor: "pointer", background: "var(--sf)", backdropFilter: "blur(10px)", borderRadius: 14, marginBottom: 8, border: "1px solid var(--bd)" }} onClick={() => setInner("settings")}>
          <div className="il" style={{ flex: 1 }}>
            <div className="ii" style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7C3AED" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>Settings</div>
              <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>Account and app preferences</div>
            </div>
          </div>
          <Icons.chev />
        </div>
      </div>

      {/* Sign out */}
      <button className="btn btn-o" onClick={onLogout} style={{ color: "var(--r)", borderColor: "#FECACA" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign Out
      </button>
    </div>
  );
}
