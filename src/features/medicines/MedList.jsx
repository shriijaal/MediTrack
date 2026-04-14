import { expSt } from "../../utils/formatters";

export function MedList({ meds, showActions, onEdit, onDelete }) {
  if (!meds.length) return (
    <div className="empty">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="10" width="20" height="8" rx="4" />
        <path d="M12 10v8" />
      </svg>
      <p>No medicines here.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {meds.map(m => {
        const isExpired  = expSt(m.expiry) === "expired";
        const q          = m.quantity ? parseFloat(m.quantity) : null;
        const isLowStock = q !== null && q <= 10;
        const isUpcoming = q !== null && q > 10 && q <= 20;

        let stStatus = "Active", stColor = "var(--g)", stBg = "var(--gl)";
        if (isExpired) { stStatus = "Expired"; stColor = "var(--r)"; stBg = "var(--rl)"; }
        else if (isLowStock) { stStatus = "Low Stock"; stColor = "var(--a)"; stBg = "var(--al)"; }
        else if (isUpcoming) { stStatus = "Upcoming Refill"; stColor = "var(--b)"; stBg = "var(--bl)"; }

        return (
          <div key={m.id} style={{ 
            background: "var(--sf)", backdropFilter: "blur(12px)", 
            borderRadius: 16, padding: "12px 16px", 
            boxShadow: "var(--sh)", border: "1px solid var(--bd)",
            display: "flex", alignItems: "center", gap: 16, transition: "all 0.2s" 
          }}>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--tx)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}>
                  {m.name}
                </h3>
                <span style={{ display: "inline-block", background: stBg, color: stColor, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" }}>
                  {stStatus}
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                {(m.dosage || m.frequency) && (
                  <div style={{ fontSize: 12, color: "var(--t2)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                    {m.dosage}{m.dosage && m.frequency ? " • " : ""}{m.frequency}
                  </div>
                )}
                {m.expiry && (
                  <div style={{ fontSize: 12, color: "var(--t2)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Exp: {m.expiry}
                  </div>
                )}
              </div>
            </div>

            {showActions && (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => onEdit && onEdit(m)} style={{ width: 34, height: 34, borderRadius: 10, background: "transparent", color: "var(--t2)", border: "1.5px solid var(--bd)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                  title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>

                <button onClick={() => onDelete && onDelete(m)} style={{ width: 34, height: 34, borderRadius: 10, background: "var(--rl)", color: "var(--r)", border: "1px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                  title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
