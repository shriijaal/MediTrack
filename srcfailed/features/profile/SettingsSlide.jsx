import { useState } from "react";
import { Slide } from "../../components/common/Slide";
import { Icons } from "../../components/icons/Icons";

export function SettingsSlide({ onBack, onAccountDetails, onLogout }) {
  const [notifPerm, setNotifPerm] = useState(
    () => "Notification" in window ? Notification.permission : "unsupported"
  );

  const requestNotifPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifPerm(result);
    if (result === "granted") {
      // Fire a test notification
      try {
        new Notification("MediTrack Reminders Enabled!", {
          body: "You'll be notified when it's time to take your medicines.",
          icon: "/favicon.ico",
        });
      } catch { }
    }
  };

  const notifStatusLabel = {
    granted: "Enabled",
    denied: "Blocked in browser",
    default: "Not enabled — tap to enable",
    unsupported: "Not supported in this browser",
  }[notifPerm] || "Unknown";

  const notifStatusColor = {
    granted: "#16A34A",
    denied: "#DC2626",
    default: "#D97706",
    unsupported: "var(--t3)",
  }[notifPerm] || "var(--t3)";

  const settingsRows = [
    {
      Icon: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
      iconBg: "#EFF6FF", iconCol: "#3B82F6",
      label: "Account Details",
      sub: "Name, email, role, member since",
      action: onAccountDetails,
      chevron: true,
    },
    {
      Icon: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      iconBg: "#F0F9FF", iconCol: "#0EA5E9",
      label: "About MediTrack",
      sub: "Version 1.0 · Medicine Management App",
      action: null,
      chevron: false,
    },
  ];

  return (
    <Slide title="Settings" onBack={onBack}>

      {/* Notification permission row */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
          Reminders
        </div>
        <div className="ir" style={{ cursor: notifPerm === "granted" ? "default" : "pointer" }}
          onClick={notifPerm !== "granted" && notifPerm !== "denied" && notifPerm !== "unsupported" ? requestNotifPermission : undefined}>
          <div className="il" style={{ flex: 1 }}>
            <div className="ii" style={{ background: notifPerm === "granted" ? "#F0FDF4" : notifPerm === "denied" ? "#FEF2F2" : "#FFFBEB", color: notifStatusColor }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>Medicine Reminders</div>
              <div style={{ fontSize: 12, marginTop: 2, color: notifStatusColor, fontWeight: 600 }}>{notifStatusLabel}</div>
              {notifPerm === "denied" && (
                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3 }}>
                  To re-enable: click the lock icon in your browser address bar → Notifications → Allow
                </div>
              )}
              {notifPerm === "default" && (
                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3 }}>
                  Get notified 5 min before each scheduled dose
                </div>
              )}
              {notifPerm === "granted" && (
                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3 }}>
                  You'll be notified 5 min before each dose
                </div>
              )}
            </div>
          </div>
          {notifPerm === "default" && (
            <button onClick={requestNotifPermission} style={{
              padding: "6px 14px", borderRadius: 8, border: "none",
              background: "var(--g)", color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", flexShrink: 0,
            }}>Enable</button>
          )}
          {notifPerm === "granted" && (
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#16A34A", flexShrink: 0 }} />
          )}
        </div>
      </div>

      <div className="ib" style={{ marginBottom: 16 }}>
        {settingsRows.map((row, i) => (
          <div key={i} className="ir" onClick={row.action || undefined} style={{ cursor: row.action ? "pointer" : "default" }}>
            <div className="il" style={{ flex: 1 }}>
              <div className="ii" style={{ background: row.iconBg, color: row.iconCol }}>
                <row.Icon />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>{row.label}</div>
                <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{row.sub}</div>
              </div>
            </div>
            {row.chevron && <Icons.chev />}
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button className="btn btn-o" onClick={onLogout} style={{ color: "var(--r)", borderColor: "#FECACA" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign Out
      </button>
    </Slide>
  );
}
