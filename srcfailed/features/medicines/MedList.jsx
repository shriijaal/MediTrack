import { expSt } from "../../utils/formatters";

export function MedList({ meds, showActions, onEdit, onDelete, onMarkTaken }) {
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

        let stStatus = "Active",  stBg = "#D1FAE5", stColor = "#10B981";
        if      (isExpired)  { stStatus = "Expired";        stBg = "#FEE2E2"; stColor = "#EF4444"; }
        else if (isLowStock) { stStatus = "Low Stock";      stBg = "#FFEDD5"; stColor = "#F97316"; }
        else if (isUpcoming) { stStatus = "Upcoming Refill"; stBg = "#DBEAFE"; stColor = "#3B82F6"; }

        return (
          <div key={m.id} style={{ background: "#ffffff", borderRadius: 18, padding: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.03)"; }}>

            <h3 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}>
              {m.name}
            </h3>

            {(m.dosage || m.frequency) && (
              <div style={{ marginTop: 6, fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                {m.dosage}{m.dosage && m.frequency ? " • " : ""}{m.frequency}
              </div>
            )}
            {m.expiry && <div style={{ marginTop: 2, fontSize: 13, color: "#64748b", fontWeight: 500 }}>Exp: {m.expiry}</div>}

            <div style={{ marginTop: 14 }}>
              <span style={{ display: "inline-block", background: stBg, color: stColor, padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" }}>
                {stStatus}
              </span>
            </div>

            {showActions && (
              <div style={{ display: "flex", gap: 6, marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                <button onClick={() => onEdit && onEdit(m)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#10B981"; e.currentTarget.style.color = "#10B981"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>

                <button onClick={() => onMarkTaken && onMarkTaken(m)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, background: "#ecfdf5", color: "#10b981", border: "1px solid transparent", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#d1fae5"}
                  onMouseLeave={e => e.currentTarget.style.background = "#ecfdf5"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Mark Taken
                </button>

                <button onClick={() => onDelete && onDelete(m)} style={{ width: 36, padding: 0, flexShrink: 0, borderRadius: 8, background: "var(--rl)", color: "var(--r)", border: "1px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                  title="Delete"
                  onMouseEnter={e => e.currentTarget.style.background = "#FECACA"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--rl)"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
