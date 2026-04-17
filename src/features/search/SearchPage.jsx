import { useState, useEffect, useRef } from "react";
import { Slide } from "../../components/common/Slide";
import { Icons } from "../../components/icons/Icons";
import { getMeds, saveMeds, getRx, saveRx } from "../../services/storage";
import { apiFetch } from "../../services/api";
import { mapMed, mapRx } from "../../utils/mappers";
import { expSt, fmtSz, fmt12 } from "../../utils/formatters";
import { PdfThumb } from "../prescriptions/PdfHelpers";

export function Hl({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="srch-hl">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Search Page ──────────────────────────────────────────────────
export function SearchPage({ userId, onBack, onViewRx }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [allMeds, setAllMeds] = useState(() => getMeds(userId));
  const [allRx, setAllRx] = useState(() => getRx(userId));
  const inputRef = useRef(null);

  // Load fresh data from backend
  useEffect(() => {
    apiFetch(`/medicines.php?patient_id=${userId}`)
      .then(data => {
        const mapped = data.map(mapMed);
        setAllMeds(mapped);
        saveMeds(userId, mapped);
      }).catch(() => { });
    apiFetch(`/prescriptions.php?patient_id=${userId}`)
      .then(data => {
        const mapped = data.map(mapRx);
        setAllRx(mapped);
        saveRx(userId, mapped);
      }).catch(() => { });
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [userId]);

  // Filter logic
  const q = query.trim().toLowerCase();

  const filteredMeds = !q ? allMeds : allMeds.filter(m =>
    m.name.toLowerCase().includes(q) ||
    (m.notes || "").toLowerCase().includes(q) ||
    m.dosage.toLowerCase().includes(q) ||
    m.frequency.toLowerCase().includes(q) ||
    m.unit.toLowerCase().includes(q)
  );

  const filteredRx = !q ? allRx : allRx.filter(r =>
    (r.title || r.name).toLowerCase().includes(q) ||
    r.name.toLowerCase().includes(q)
  );

  const showMeds = tab === "all" || tab === "meds";
  const showRx = tab === "all" || tab === "rx";

  // Show items if: there's a query, OR a specific tab is selected (not "all")
  const showResults = q || tab !== "all";
  const totalResults = (showMeds ? filteredMeds.length : 0) + (showRx ? filteredRx.length : 0);
  const noResults = showResults && totalResults === 0;

  return (
    <Slide title="Search" onBack={onBack}>
      {/* Override slide-bd padding — we control it manually */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", margin: "-20px" }}>

        {/* Search bar */}
        <div className="srch-wrap">
          <div className="srch-bar">
            <Icons.search />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search medicines or prescriptions…"
              autoComplete="off"
            />
            {query && (
              <button className="srch-clear" onClick={() => setQuery("")}>
                <Icons.close />
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="srch-tabs">
          {[
            { id: "all", label: `All (${(showMeds ? filteredMeds.length : 0) + (showRx ? filteredRx.length : 0)})` },
            { id: "meds", label: `Medicines (${filteredMeds.length})` },
            { id: "rx", label: `Prescriptions (${filteredRx.length})` },
          ].map(t => (
            <button key={t.id} className={`srch-tab${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="srch-results">

          {/* Empty — no query and on "all" tab */}
          {!showResults && (
            <div className="srch-empty">
              <Icons.search />
              <p>Start typing to search<br />your medicines and prescriptions.</p>
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className="srch-empty">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
              <p>{q ? <>No results for "<strong>{query}</strong>".<br />Try a different search term.</> : "No items in this category."}</p>
            </div>
          )}

          {/* Medicine results */}
          {showResults && showMeds && filteredMeds.length > 0 && (
            <>
              <div className="srch-section-lbl">💊 Medicines · {filteredMeds.length}</div>
              {filteredMeds.map(m => {
                const st = expSt(m.expiry);
                return (
                  <div key={m.id} className={`mc ${st || ""}`} style={{ marginBottom: 8 }}>
                    <div className="mc-top">
                      <div>
                        <div className="mc-n"><Hl text={m.name} query={query} /></div>
                        <div className="mc-d">
                          <Hl text={`${m.dosage} ${m.unit}`} query={query} />
                          {" · "}
                          <Hl text={m.frequency} query={query} />
                        </div>
                      </div>
                    </div>
                    <div className="chips">
                      {(m.times || []).map(t => <span key={t} className="ch ch-g">🕐 {fmt12(t)}</span>)}
                      {m.quantity && <span className="ch ch-n">📦 {m.quantity}</span>}
                      {m.expiry && (
                        <span className={`ch ${st === "expired" ? "ch-r" : st === "expiring" ? "ch-a" : "ch-n"}`}>
                          {st === "expired" ? "⚠️ Expired " : st === "expiring" ? "⚠️ " : "📅 "}{m.expiry}
                        </span>
                      )}
                    </div>
                    {m.notes && (
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--t3)", fontStyle: "italic" }}>
                        "<Hl text={m.notes} query={query} />"
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Prescription results */}
          {showResults && showRx && filteredRx.length > 0 && (
            <>
              <div className="srch-section-lbl" style={{ marginTop: showMeds && filteredMeds.length > 0 ? 16 : 0 }}>
                📄 Prescriptions · {filteredRx.length}
              </div>
              {filteredRx.map(rx => {
                const displayTitle = rx.title || rx.name;
                return (
                  <div key={rx.id} className="srch-rx-card" onClick={() => onViewRx(rx)}>
                    <div className="srch-rx-thumb">
                      {rx.type?.includes("image")
                        ? <img src={rx.data || rx.url} alt="" />
                        : <PdfThumb dataUrl={rx.data || rx.url} size={44} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "var(--text-sm)" }}>
                        <Hl text={displayTitle} query={query} />
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--t3)", marginTop: 2 }}>
                        {fmtSz(rx.size)} · {rx.uploadedAt}
                      </div>
                    </div>
                    <div style={{ color: "var(--t3)", flexShrink: 0 }}><Icons.chev /></div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </Slide>
  );
}
