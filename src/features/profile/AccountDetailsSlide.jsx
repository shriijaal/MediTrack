import { Slide } from "../../components/common/Slide";

export function AccountDetailsSlide({ user, onBack }) {
  const details = [
    {
      label: "Full Name",
      value: user.name,
      Icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
      bg: "#EFF6FF", col: "#3B82F6",
    },
    {
      label: "Email Address",
      value: user.email,
      Icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
      bg: "#F0FDF4", col: "#22C55E",
    },
    {
      label: "Account Type",
      value: user.role,
      Icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
      bg: "#FAF5FF", col: "#9333EA",
    },
    {
      label: "Member Since",
      value: new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      Icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
      bg: "#FFF7ED", col: "#F97316",
    },
    {
      label: "Account ID",
      value: "#" + String(user.id || "—").slice(0, 8).toUpperCase(),
      Icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
      bg: "#F0F9FF", col: "#0EA5E9",
    },
  ];

  return (
    <Slide title="Account Details" onBack={onBack}>
      {/* Mini avatar card */}
      <div style={{
        background: "linear-gradient(135deg,#0D6B4A,#16A97A)",
        borderRadius: "var(--rd)", padding: "22px 20px",
        display: "flex", alignItems: "center", gap: 16,
        marginBottom: 20, color: "#fff",
      }}>
        <div className="av" style={{ width: 52, height: 52, fontSize: "var(--text-2xl)" }}>{user.name[0].toUpperCase()}</div>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "var(--text-lg)", fontWeight: 700 }}>{user.name}</div>
          <div style={{ fontSize: "var(--text-xs)", opacity: .8, marginTop: 3 }}>{user.email}</div>
        </div>
      </div>

      {/* Detail rows */}
      <div className="ib">
        {details.map((d, i) => (
          <div key={i} className="ir">
            <div className="il">
              <div className="ii" style={{ background: d.bg, color: d.col }}>
                <d.Icon />
              </div>
              <div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--t3)", marginBottom: 1, textTransform: "uppercase", letterSpacing: ".4px", fontWeight: 500 }}>{d.label}</div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--tx)" }}>{d.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--s2)", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginTop: 4 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--t3)", lineHeight: 1.6 }}>
          Your account information is stored securely. To change your email or password, contact support or update it through the settings.
        </p>
      </div>
    </Slide>
  );
}
