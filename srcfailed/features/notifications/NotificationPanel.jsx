import { useState } from "react";
import { Icons } from "../../components/icons/Icons";
import { getMeds, getSeenNotifs, saveSeenNotifs } from "../../services/storage";
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

export function NotificationPanel({ userId, onClose }) {
  const allNotes = buildNotifications(userId);
  const seen = getSeenNotifs(userId);
  const [seenIds, setSeenIds] = useState(seen);

  const markAllRead = () => {
    const ids = allNotes.map(n => n.id);
    setSeenIds(ids);
    saveSeenNotifs(userId, ids);
  };

  const unreadCount = allNotes.filter(n => !seenIds.includes(n.id)).length;

  // Mark as read when panel opens (after short delay so user sees badges)
  useEffect(() => {
    const t = setTimeout(markAllRead, 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Invisible backdrop to close on outside click */}
      <div className="notif-overlay" onClick={onClose} />
      <div className="notif-panel">
        <div className="notif-hd">
          <span className="notif-title">
            Notifications {unreadCount > 0 && <span style={{ background: "var(--rl)", color: "var(--r)", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700, marginLeft: 6 }}>{unreadCount}</span>}
          </span>
          {allNotes.length > 0 && <button className="notif-clear" onClick={markAllRead}>Mark all read</button>}
        </div>
        <div className="notif-list">
          {allNotes.length === 0 ? (
            <div className="notif-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /><line x1="2" y1="2" x2="22" y2="22" style={{ display: "none" }} /><path d="M9 9a3 3 0 0 0 5.12 2.12" /></svg>
              <p>You're all caught up!<br />No alerts right now.</p>
            </div>
          ) : (
            allNotes.map(n => {
              const isUnread = !seenIds.includes(n.id);
              return (
                <div key={n.id} className={`notif-item${isUnread ? " unread" : ""}`}>
                  <div className="notif-dot-wrap">
                    <div className="notif-icon" style={{ background: n.iconBg }}>{n.icon}</div>
                    {isUnread && <div className="notif-unread-dot" />}
                  </div>
                  <div className="notif-body">
                    <div className="notif-msg">{n.msg}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
