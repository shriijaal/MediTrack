import { getMeds } from "../../services/storage";
import { fmt12 } from "../../utils/formatters";

export function buildNotifications(userId) {
  const meds = getMeds(userId);
  const notes = [];
  const now = new Date();
  const nowStr = now.toTimeString().slice(0, 5);

  meds.forEach(m => {
    const expiry = m.expiry;
    // Expired medicines
    if (expiry && new Date(expiry) < now) {
      notes.push({
        id: "exp-" + m.id,
        icon: "⚠️",
        iconBg: "var(--rl)",
        msg: <><strong>{m.name}</strong> has expired. Please replace it.</>,
        time: "Expiry: " + expiry,
        type: "danger",
      });
    }
    // Expiring within 7 days
    else if (expiry) {
      const days = Math.ceil((new Date(expiry) - now) / 86400000);
      if (days <= 7) {
        notes.push({
          id: "soon-" + m.id,
          icon: "📅",
          iconBg: "var(--al)",
          msg: <><strong>{m.name}</strong> expires in {days} day{days !== 1 ? "s" : ""}.</>,
          time: "Expiry: " + expiry,
          type: "warn",
        });
      }
    }
    // Today's upcoming doses — respect frequency
    const freq = (m.frequency || "").toLowerCase();
    const todayDow = new Date().getDay();
    const showToday = freq !== "as needed" &&
      (freq !== "weekly" || todayDow === 1);

    if (showToday) {
      (m.times || []).forEach(t => {
        if (t >= nowStr) {
          notes.push({
            id: "dose-" + m.id + "-" + t,
            icon: "💊",
            iconBg: "var(--gl)",
            msg: <><strong>{m.name}</strong> — {m.dosage} {m.unit} due at {t}.</>,
            time: "Today " + fmt12(t),
            type: "info",
          });
        }
      });
    }
  });

  // Sort: danger first, then warn, then info
  const order = { danger: 0, warn: 1, info: 2 };
  notes.sort((a, b) => order[a.type] - order[b.type]);
  return notes;
}
