// ── localStorage helpers ──────────────────────────────────────────
// All localStorage keys are defined here.
// Key shapes must NOT change — they are coupled to cached data in users' browsers.
//
// Key inventory:
//   mt_users              — offline-only user list (fallback when backend offline)
//   mt_sess               — current session object (includes token)
//   mt_meds{userId}       — medicine cache per user
//   mt_rx{userId}         — prescription cache per user
//   mt_doses_{uid}_{date} — daily dose log (used in Dashboard + reminder system)
//   mt_caretaker_rels     — caretaker relationship list (offline fallback)
//   mt_caretaker_rels_for_{patientId} — reverse lookup for patient
//   mt_invites            — offline invite codes
//   mt_hide_email_{uid}   — email visibility preference in ProfileTab
//   mt_seen_notifs_{uid}  — which in-app notifications have been seen
//   mt_notif_fired_{uid}  — which browser notifications were fired today

// ── Auth / Session ──────────────────────────────────────────────
export const getUsers    = ()    => JSON.parse(localStorage.getItem("mt_users") || "[]");
export const saveUsers   = u     => localStorage.setItem("mt_users", JSON.stringify(u));
export const getSession  = ()    => JSON.parse(localStorage.getItem("mt_sess") || "null");
export const saveSession = u     => localStorage.setItem("mt_sess", JSON.stringify(u));
export const clearSess   = ()    => localStorage.removeItem("mt_sess");

// ── Medicines ───────────────────────────────────────────────────
export const getMeds  = id    => JSON.parse(localStorage.getItem("mt_meds" + id) || "[]");
export const saveMeds = (id, m) => localStorage.setItem("mt_meds" + id, JSON.stringify(m));

// ── Prescriptions ───────────────────────────────────────────────
export const getRx    = id    => JSON.parse(localStorage.getItem("mt_rx" + id) || "[]");
export const saveRx   = (id, r) => localStorage.setItem("mt_rx" + id, JSON.stringify(r));

// ── Dose logs (daily, keyed by userId + date) ───────────────────
// Key format: mt_doses_{userId}_{YYYY-MM-DD}
// Resets each day automatically because the key includes the date.
export const getDoseLog  = (userId, date) =>
  JSON.parse(localStorage.getItem(`mt_doses_${userId}_${date}`) || "{}");

export const saveDoseLog = (userId, date, log) =>
  localStorage.setItem(`mt_doses_${userId}_${date}`, JSON.stringify(log));

// ── Caretaker (inline keys used in ProfileTab) ──────────────────
// These are accessed inline in ProfileTab using their raw key strings.
// They are listed here for documentation only — ProfileTab reads/writes them directly.
// mt_caretaker_rels
// mt_caretaker_rels_for_{patientId}
// mt_invites

// ── Notification state ──────────────────────────────────────────
// mt_seen_notifs_{userId}   — seen in-app notifications
// mt_notif_fired_{userId}   — fired browser notifications today
// mt_hide_email_{userId}    — email visibility in ProfileTab
// These are accessed inline in their respective components.

// ── Notification seen state ─────────────────────────────────────
// mt_seen_notifs_{userId} — tracks which in-app notification IDs have been seen
export const getSeenNotifs = (userId) =>
  JSON.parse(localStorage.getItem(`mt_seen_notifs_${userId}`) || "[]");

export const saveSeenNotifs = (userId, ids) =>
  localStorage.setItem(`mt_seen_notifs_${userId}`, JSON.stringify(ids));

// ── Reminder fired-today tracking ───────────────────────────────
// mt_notif_fired_{userId} — tracks which browser notifications were fired today
// Value shape: { "YYYY-MM-DD": ["medId_HH:MM", "missed_medId_HH:MM", ...] }
export const getFiredNotifs = (userId) =>
  JSON.parse(localStorage.getItem(`mt_notif_fired_${userId}`) || "{}");

export const saveFiredNotifs = (userId, data) =>
  localStorage.setItem(`mt_notif_fired_${userId}`, JSON.stringify(data));

// ── Caretaker relationships (offline fallback) ───────────────────
// These keys are used directly by ProfileTab for offline caretaker flows.
// Centralised here for documentation and safe access.
export const getCaretakerRels = () =>
  JSON.parse(localStorage.getItem("mt_caretaker_rels") || "[]");

export const saveCaretakerRels = (rels) =>
  localStorage.setItem("mt_caretaker_rels", JSON.stringify(rels));

export const getPatientRels = (patientId) =>
  JSON.parse(localStorage.getItem(`mt_caretaker_rels_for_${patientId}`) || "[]");

export const savePatientRels = (patientId, rels) =>
  localStorage.setItem(`mt_caretaker_rels_for_${patientId}`, JSON.stringify(rels));

export const getInvites = () =>
  JSON.parse(localStorage.getItem("mt_invites") || "[]");

export const saveInvites = (invites) =>
  localStorage.setItem("mt_invites", JSON.stringify(invites));

export const getHideEmail = (userId) =>
  localStorage.getItem(`mt_hide_email_${userId}`) !== "0";

export const saveHideEmail = (userId, hide) =>
  localStorage.setItem(`mt_hide_email_${userId}`, hide ? "0" : "1");
