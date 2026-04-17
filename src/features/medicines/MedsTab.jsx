import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "../../components/common/Modal";
import { Icons } from "../../components/icons/Icons";
import { getMeds, saveMeds } from "../../services/storage";
import { apiFetch } from "../../services/api";
import { mapMed } from "../../utils/mappers";
import { uid } from "../../utils/constants";
import { expSt } from "../../utils/formatters";
import { MedForm } from "./MedForm";
import { MedList } from "./MedList";
import { ConfirmDel } from "./ConfirmDel";

// ── Scrollable category filter strip with auto-hiding arrows ────────────────
function CatFilterStrip({ cats, filter, setFilter, count }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 6);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkArrows();
    const t = setTimeout(checkArrows, 200);
    window.addEventListener("resize", checkArrows);
    return () => { clearTimeout(t); window.removeEventListener("resize", checkArrows); };
  }, [cats, checkArrows]);

  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });

  return (
    <div style={{ position: "relative" }}>
      {/* Left arrow */}
      <div
        onClick={() => scroll(-1)}
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 44, zIndex: 2,
          background: "linear-gradient(to left, transparent 0%, var(--bg, #f8fafc) 70%)",
          display: "flex", alignItems: "center", justifyContent: "flex-start",
          opacity: showLeft ? 1 : 0, pointerEvents: showLeft ? "all" : "none",
          transition: "opacity .2s", cursor: "pointer",
        }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%", background: "var(--sf)",
          border: "1.5px solid var(--bd)", display: "flex", alignItems: "center",
          justifyContent: "center", color: "var(--g)", boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
      </div>

      {/* Right arrow */}
      <div
        onClick={() => scroll(1)}
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 44, zIndex: 2,
          background: "linear-gradient(to right, transparent 0%, var(--bg, #f8fafc) 70%)",
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          opacity: showRight ? 1 : 0, pointerEvents: showRight ? "all" : "none",
          transition: "opacity .2s", cursor: "pointer",
        }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%", background: "var(--sf)",
          border: "1.5px solid var(--bd)", display: "flex", alignItems: "center",
          justifyContent: "center", color: "var(--g)", boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Scrollable pill row */}
      <div
        ref={scrollRef}
        onScroll={checkArrows}
        style={{
          display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
          scrollbarWidth: "none", msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}>
        {cats.map(cat => {
          const active = filter === cat.id;
          const n = count(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                padding: "7px 14px", borderRadius: 20,
                border: active ? `2px solid ${cat.color}` : "1.5px solid var(--bd)",
                background: active ? cat.bg : "var(--sf)",
                color: active ? cat.color : "var(--t2)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "var(--text-sm)", fontWeight: active ? 700 : 500,
                cursor: "pointer", outline: "none",
                boxShadow: active ? `0 2px 8px ${cat.color}28` : "var(--sh)",
                transition: "border .15s, background .15s, color .15s, box-shadow .15s",
              }}>
              {cat.label}
              {n > 0 && (
                <span style={{
                  background: active ? cat.color : "var(--bd)",
                  color: active ? "#fff" : "var(--t2)",
                  borderRadius: 20, padding: "1px 7px",
                  fontSize: "var(--text-xs)", fontWeight: 700,
                  transition: "background .15s, color .15s",
                }}>{n}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MedsTab({ userId, toast, caretakerPatientId, onBack }) {
  const writeId = caretakerPatientId || userId;
  const patientQs = caretakerPatientId ? `?patient_id=${caretakerPatientId}` : "";

  const [meds, setMeds] = useState(() => getMeds(writeId));
  const [modal, setM] = useState(null);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Reusable fetch helper (also called manually after add)
  const loadMeds = async () => {
    try {
      const data = await apiFetch(`/medicines.php${patientQs}`);
      const mapped = data.map(mapMed);
      setMeds(mapped);
      saveMeds(writeId, mapped);
    } catch { /* offline — use localStorage */ }
  };

  // Async IIFE pattern avoids the "synchronous setState in effect" lint warning
  useEffect(() => {
    (async () => { await loadMeds(); })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeId]);

  // Save helper — tries backend, always updates localStorage
  const apiSave = async (method, body, medId) => {
    const qs = medId
      ? `?id=${medId}${caretakerPatientId ? `&patient_id=${caretakerPatientId}` : ""}`
      : patientQs;
    const payload = caretakerPatientId ? { ...body, patient_id: caretakerPatientId } : body;
    try {
      await apiFetch(`/medicines.php${qs}`, { method, body: JSON.stringify(payload) });
      return true;
    } catch (e) {
      console.warn("Medicine API save failed:", e.message);
      return false;
    }
  };

  const add = async f => {
    const newMed = { ...f, id: uid(), createdAt: Date.now() };
    const updated = [...meds, newMed];
    setMeds(updated); saveMeds(writeId, updated);
    setM(null);
    const saved = await apiSave("POST", f);
    toast(saved ? "Added!" : "Added locally (offline)", saved ? "ok" : "warn");
    if (saved) await loadMeds(); // refresh to get real DB id
  };

  const edit = async f => {
    const medId = modal.data.id;
    const updated = meds.map(m => m.id === medId ? { ...m, ...f } : m);
    setMeds(updated); saveMeds(writeId, updated);
    setM(null); toast("Updated!", "ok");
    await apiSave("PUT", f, medId);
  };

  const del = async () => {
    const medId = modal.data.id;
    const updated = meds.filter(m => m.id !== medId);
    setMeds(updated); saveMeds(writeId, updated);
    setM(null); toast("Removed.", "ok");
    try {
      const qs = `?id=${medId}${caretakerPatientId ? `&patient_id=${caretakerPatientId}` : ""}`;
      await apiFetch(`/medicines.php${qs}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Medicine delete API failed:", e.message);
    }
  };

  // ── Category definitions ──────────────────────────────────────────
  const CATS = [
    { id: "All", label: "All", color: "#64748B", bg: "#F1F5F9", activeColor: "#ffffff", activeBg: "#0F172A", match: () => true },
    { id: "Active", label: "Active", color: "#10B981", bg: "#D1FAE5", activeColor: "#ffffff", activeBg: "#10B981", match: m => !expSt(m.expiry) },
    { id: "Expired", label: "Expired", color: "#EF4444", bg: "#FEE2E2", activeColor: "#ffffff", activeBg: "#EF4444", match: m => expSt(m.expiry) === "expired" },
    { id: "LowStock", label: "Low Stock", color: "#F97316", bg: "#FFEDD5", activeColor: "#ffffff", activeBg: "#F97316", match: m => m.quantity && parseFloat(m.quantity) <= 10 },
  ];

  const activeCat = CATS.find(c => c.id === filter) || CATS[0];
  const filtered = meds.filter(m => {
    if (!activeCat.match(m)) return false;
    if (searchQuery.trim() && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Count badge per category (ignoring search so counts don't jump)
  const count = id => meds.filter(CATS.find(c => c.id === id)?.match || (() => true)).length;

  // ── Dashboard Stats ──
  const statToday = meds.filter(m => m.frequency !== "As needed" && expSt(m.expiry) !== "expired").length;
  const statExpired = meds.filter(m => expSt(m.expiry) === "expired").length;
  const statLow = meds.filter(m => m.quantity && parseFloat(m.quantity) <= 10).length;
  const statRefill = meds.filter(m => m.quantity && parseFloat(m.quantity) > 10 && parseFloat(m.quantity) <= 20).length;

  const getTimeGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="cnt">
      {/* Header row at the very top */}
      <div className="page-hd">
        {onBack && (
          <button className="page-bk" onClick={onBack} title="Go back">
            <Icons.back />
          </button>
        )}
        <h2 className="pt" style={{ marginBottom: 0, flex: 1 }}>My Medicines</h2>
        <button className="btn btn-p btn-sm" style={{ width: "auto" }} onClick={() => setM({ type: "add" })}>
          <Icons.plus /> Add
        </button>
      </div>

      {/* ── Dashboard / Home Section ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--tx)", margin: 0, fontFamily: "'Syne', sans-serif" }}>
            {getTimeGreeting()} 👋
          </h1>
          <p style={{ color: "var(--t3)", margin: "4px 0 0 0", fontSize: "var(--text-base)", fontWeight: 500 }}>
            Stay on track with your meds
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12
        }}>
          {/* Today */}
          <div style={{ background: "var(--sf)", backdropFilter: "blur(12px)", borderRadius: 16, padding: "16px", boxShadow: "var(--sh)", border: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#10B981", lineHeight: 1 }}>{statToday}</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--t2)", lineHeight: 1.2 }}>Today's<br />Meds</div>
          </div>
          {/* Expired */}
          <div style={{ background: "var(--sf)", backdropFilter: "blur(12px)", borderRadius: 16, padding: "16px", boxShadow: "var(--sh)", border: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#EF4444", lineHeight: 1 }}>{statExpired}</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--t2)", lineHeight: 1.2 }}>Expired<br />Meds</div>
          </div>
          {/* Low Stock */}
          <div style={{ background: "var(--sf)", backdropFilter: "blur(12px)", borderRadius: 16, padding: "16px", boxShadow: "var(--sh)", border: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#F97316", lineHeight: 1 }}>{statLow}</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--t2)", lineHeight: 1.2 }}>Low<br />Stock</div>
          </div>
          {/* Refills */}
          <div style={{ background: "var(--sf)", backdropFilter: "blur(12px)", borderRadius: 16, padding: "16px", boxShadow: "var(--sh)", border: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#3B82F6", lineHeight: 1 }}>{statRefill}</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--t2)", lineHeight: 1.2 }}>Upcoming<br />Refills</div>
          </div>
        </div>
      </div>

      {/* ── Compact Search & Filters ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {/* Search Bar */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg style={{ position: "absolute", left: 16, color: "#94a3b8" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search medications..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px 12px 42px", borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.06)", background: "#ffffff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)", outline: "none",
              fontSize: "var(--text-base)", color: "#1e293b", fontFamily: "'DM Sans', sans-serif",
              transition: "border 0.2s, box-shadow 0.2s"
            }}
            onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 4px 14px rgba(59,130,246,0.1)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.06)"; e.target.style.boxShadow = "0 2px 10px rgba(0,0,0,0.02)"; }}
          />
        </div>

        {/* Filter Pills — horizontal scroll strip with auto-hiding arrows */}
        <CatFilterStrip cats={CATS} filter={filter} setFilter={setFilter} count={count} />
      </div>

      {/* ── Medicine list ── */}
      {filtered.length === 0 ? (
        <div className="empty">
          <span style={{ fontSize: 40, display: "flex", justifyContent: "center", marginBottom: 10, opacity: .4 }}>
            {activeCat.Icon ? <activeCat.Icon color="currentColor" /> : null}
          </span>
          <p>No {activeCat.label.toLowerCase()} medicines.<br />
            {filter === "All" ? 'Tap "+ Add" to add your first medicine.' : ""}
          </p>
        </div>
      ) : (
        <MedList meds={filtered} showActions
          onEdit={m => setM({ type: "edit", data: m })}
          onDelete={m => setM({ type: "del", data: m })} />
      )}

      {modal?.type === "add" && <Modal title="Add Medicine" onClose={() => setM(null)}><MedForm onSave={add} onClose={() => setM(null)} /></Modal>}
      {modal?.type === "edit" && <Modal title="Edit Medicine" onClose={() => setM(null)}><MedForm initial={modal.data} onSave={edit} onClose={() => setM(null)} /></Modal>}
      {modal?.type === "del" && <ConfirmDel name={modal.data.name} onConfirm={del} onClose={() => setM(null)} />}
    </div>
  );
}
