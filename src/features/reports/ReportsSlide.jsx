import { useState, useEffect, useCallback } from "react";
import { Slide } from "../../components/common/Slide";
import { apiFetch } from "../../services/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Adherence ring
const AdherenceRing = ({ pct }) => {
  if (pct === null || pct === undefined) return (
    <div style={{ textAlign: "center", color: "var(--t3)", fontSize: 13 }}>No data yet</div>
  );
  const r = 40, circ = 2 * Math.PI * r;
  const stroke = circ - (pct / 100) * circ;
  const color = pct >= 80 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--s2)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={stroke}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset .6s ease" }} />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 18, fontWeight: 800, fill: color, fontFamily: "'Syne',sans-serif" }}>
          {pct}%
        </text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>Adherence Rate</div>
    </div>
  );
};

// Bar chart for weekly/monthly
const BarChart = ({ bars }) => {
  if (!bars?.length) return null;
  const max = Math.max(...bars.map(b => b.taken + b.missed), 1);
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 90, padding: "0 4px" }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 70, gap: 2 }}>
            {b.taken > 0 && (
              <div style={{
                width: "100%", borderRadius: "4px 4px 0 0",
                height: `${(b.taken / max) * 68}px`,
                background: "#16A34A", minHeight: 4,
                transition: "height .4s ease",
              }} />
            )}
            {b.missed > 0 && (
              <div style={{
                width: "100%", borderRadius: b.taken > 0 ? 0 : "4px 4px 0 0",
                height: `${(b.missed / max) * 68}px`,
                background: "#DC2626", minHeight: 4,
                transition: "height .4s ease",
              }} />
            )}
            {b.taken === 0 && b.missed === 0 && (
              <div style={{ width: "100%", height: 4, borderRadius: 4, background: "var(--s2)" }} />
            )}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", textAlign: "center" }}>
            {b.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// Dose row
const DoseRow = ({ item, status }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
    background: status === "taken" ? "#F0FDF4" : "#FEF2F2",
    borderRadius: 10, marginBottom: 5,
    border: `1px solid ${status === "taken" ? "#BBF7D0" : "#FECACA"}`,
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      background: status === "taken" ? "#DCFCE7" : "#FEE2E2",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: status === "taken" ? "#16A34A" : "#DC2626",
    }}>
      {status === "taken"
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      }
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.med_name}</div>
      <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>{item.log_date} · {item.time}</div>
    </div>
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
      background: status === "taken" ? "#DCFCE7" : "#FEE2E2",
      color: status === "taken" ? "#16A34A" : "#DC2626",
      flexShrink: 0,
    }}>{status === "taken" ? "Taken" : "Missed"}</span>
  </div>
);

// Med change row
const ChangeRow = ({ item }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
    background: "#EFF6FF", borderRadius: 10, marginBottom: 5,
    border: "1px solid #BFDBFE",
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
      <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>{item.dosage} {item.unit} · {item.frequency}</div>
    </div>
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#DBEAFE", color: "#2563EB", flexShrink: 0 }}>Added {item.date}</span>
  </div>
);

const SectionHeader = ({ label, count, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 16 }}>
    <div style={{ width: 3, height: 16, borderRadius: 2, background: color, flexShrink: 0 }} />
    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</div>
    {count !== undefined && (
      <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color, background: color + "22", borderRadius: 20, padding: "1px 10px" }}>{count}</span>
    )}
  </div>
);

export function ReportsSlide({ userId, onBack }) {
  const [view, setView] = useState("weekly"); // "daily"|"weekly"|"monthly"
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Date navigation
  const [curDate, setCurDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [curYear, setCurYear] = useState(() => new Date().getFullYear());
  const [curMonth, setCurMonth] = useState(() => new Date().getMonth() + 1);

  const load = useCallback(async (v, date, year, month) => {
    await Promise.resolve(); // Move state updates to a microtask to avoid synchronous cascading renders in the effect
    setLoading(true); setError("");
    try {
      let path = `/reports.php?patient_id=${userId}&type=${v}`;
      if (v === "daily") path += `&date=${date}`;
      if (v === "weekly") path += `&date=${date}`;
      if (v === "monthly") path += `&year=${year}&month=${month}`;
      const d = await apiFetch(path);
      setData(d);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { 
    const t = setTimeout(() => {
      load(view, curDate, curYear, curMonth); 
    }, 0);
    return () => clearTimeout(t);
  }, [load, view, curDate, curYear, curMonth]);

  // Navigation helpers
  const shiftDate = (dir) => {
    const d = new Date(curDate);
    d.setDate(d.getDate() + dir);
    setCurDate(d.toISOString().split("T")[0]);
  };
  const shiftWeek = (dir) => shiftDate(dir * 7);
  const shiftMonth = (dir) => {
    let m = curMonth + dir, y = curYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCurMonth(m); setCurYear(y);
  };



  return (
    <Slide title="Medication Reports" onBack={onBack}>
      {/* View toggle */}
      <div style={{ display: "flex", background: "var(--s2)", borderRadius: 12, padding: 3, gap: 2, marginBottom: 20 }}>
        {["daily", "weekly", "monthly"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
            fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700,
            letterSpacing: ".3px", textTransform: "capitalize", transition: "all .2s",
            background: view === v ? "var(--sf)" : "transparent",
            color: view === v ? "var(--g)" : "var(--t3)",
            boxShadow: view === v ? "var(--sh)" : "none",
          }}>{v}</button>
        ))}
      </div>

      {/* Date navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, background: "var(--sf)", borderRadius: 12, padding: "10px 14px", boxShadow: "var(--sh)" }}>
        <button onClick={() => view === "monthly" ? shiftMonth(-1) : view === "weekly" ? shiftWeek(-1) : shiftDate(-1)}
          style={{ background: "var(--s2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t2)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          {view === "daily" && <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700 }}>{new Date(curDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>}
          {view === "weekly" && data && <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700 }}>{data.from} → {data.to}</div>}
          {view === "monthly" && <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700 }}>{MONTHS[curMonth - 1]} {curYear}</div>}
        </div>
        <button onClick={() => view === "monthly" ? shiftMonth(1) : view === "weekly" ? shiftWeek(1) : shiftDate(1)}
          style={{ background: "var(--s2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t2)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t3)" }}>Loading report…</div>}
      {error && <div style={{ background: "var(--rl)", color: "var(--r)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {!loading && data && (<>
        {/* Adherence + summary stats */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--sf)", borderRadius: 14, padding: "16px", boxShadow: "var(--sh)", marginBottom: 4 }}>
          <AdherenceRing pct={data.adherence_pct} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "#F0FDF4", borderRadius: 10, padding: "10px 12px", border: "1px solid #BBF7D0" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#16A34A" }}>{data.taken?.length ?? 0}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", marginTop: 2 }}>✓ Taken</div>
              </div>
              <div style={{ flex: 1, background: "#FEF2F2", borderRadius: 10, padding: "10px 12px", border: "1px solid #FECACA" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#DC2626" }}>{data.missed?.length ?? 0}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", marginTop: 2 }}>✗ Missed</div>
              </div>
            </div>
            {data.changes?.length > 0 && (
              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "8px 12px", border: "1px solid #BFDBFE" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#2563EB" }}>+ {data.changes.length} medicine{data.changes.length > 1 ? "s" : ""} added</div>
              </div>
            )}
          </div>
        </div>

        {/* Bar chart for weekly/monthly */}
        {view === "weekly" && data.days && (<>
          <SectionHeader label="Daily breakdown" color="var(--g)" />
          <div style={{ background: "var(--sf)", borderRadius: 14, padding: "16px", boxShadow: "var(--sh)", marginBottom: 4 }}>
            <BarChart bars={data.days} />
            <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#16A34A" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#16A34A" }} />Taken
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#DC2626" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#DC2626" }} />Missed
              </div>
            </div>
          </div>
        </>)}

        {view === "monthly" && data.weeks && (<>
          <SectionHeader label="Weekly breakdown" color="var(--g)" />
          <div style={{ background: "var(--sf)", borderRadius: 14, padding: "16px", boxShadow: "var(--sh)", marginBottom: 4 }}>
            <BarChart bars={data.weeks} />
            <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#16A34A" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#16A34A" }} />Taken
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#DC2626" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#DC2626" }} />Missed
              </div>
            </div>
          </div>
        </>)}

        {/* Taken doses */}
        {data.taken?.length > 0 && (<>
          <SectionHeader label="Taken doses" count={data.taken.length} color="#16A34A" />
          {data.taken.map((d, i) => <DoseRow key={i} item={d} status="taken" />)}
        </>)}

        {/* Missed doses */}
        {data.missed?.length > 0 && (<>
          <SectionHeader label="Missed doses" count={data.missed.length} color="#DC2626" />
          {data.missed.map((d, i) => <DoseRow key={i} item={d} status="missed" />)}
        </>)}

        {/* Medication changes */}
        {data.changes?.length > 0 && (<>
          <SectionHeader label="Medications added" count={data.changes.length} color="#2563EB" />
          {data.changes.map((d, i) => <ChangeRow key={i} item={d} />)}
        </>)}

        {/* Empty state */}
        {data.total === 0 && !data.changes?.length && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--t3)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ opacity: .4, marginBottom: 12 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No data for this period</div>
            <div style={{ fontSize: 12 }}>Mark medicines as taken or missed on the Home screen to see your report.</div>
          </div>
        )}
      </>)}
    </Slide>
  );
}
