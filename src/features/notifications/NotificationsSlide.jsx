import { useState, useEffect } from "react";
import { Icons } from "../../components/icons/Icons";
import { Slide } from "../../components/common/Slide";
import { getSeenNotifs, saveSeenNotifs } from "../../services/storage";
import { buildNotifications } from "./notificationUtils.jsx";

export function NotificationsSlide({ userId, onBack }) {
  const allNotes = buildNotifications(userId);
  const seen = getSeenNotifs(userId);
  const [seenIds, setSeenIds] = useState(seen);

  const markAllRead = () => {
    const ids = allNotes.map(n => n.id);
    setSeenIds(ids);
    saveSeenNotifs(userId, ids);
  };

  useEffect(() => {
    // Automatically mark as read after a short delay
    const ids = allNotes.map(n => n.id);
    const t = setTimeout(() => {
      setSeenIds(ids);
      saveSeenNotifs(userId, ids);
    }, 2000);
    return () => clearTimeout(t);
  }, [allNotes, userId]);

  const ActionBtn = allNotes.length > 0 && (
    <button className="notif-clear" onClick={markAllRead}>Mark all read</button>
  );

  return (
    <Slide title="Notifications" onBack={onBack} action={ActionBtn}>
      <div className="notif-list-standalone">
        {allNotes.length === 0 ? (
          <div className="notif-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>You're all caught up!<br />No alerts right now.</p>
          </div>
        ) : (
          allNotes.map(n => {
            const isUnread = !seenIds.includes(n.id);
            return (
              <div key={n.id} className={`notif-item standalone${isUnread ? " unread" : ""}`}>
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
    </Slide>
  );
}
