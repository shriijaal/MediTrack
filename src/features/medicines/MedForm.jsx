import { useState } from "react";
import { Icons } from "../../components/icons/Icons";
import { FREQ, UNITS } from "../../utils/constants";

export function MedForm({ initial, onSave, onClose }) {
  const blank = { 
    name: "", dosage: "", unit: "mg", 
    frequency: "Once daily", times: [], 
    quantity: "", expiry: "", notes: "",
    pillColor: "#16A97A", typeIcon: "",
    startDate: new Date().toISOString().split("T")[0]
  };

  const [form, setF] = useState(() => initial ? { ...initial } : { ...blank });
  const [ti, setTi] = useState({ hour: "", min: "00", ampm: "AM" });
  const [err, setE] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const set = (k, v) => { setF(f => ({ ...f, [k]: v })); setE(""); };

  const to24 = ({ hour, min, ampm }) => {
    let h = parseInt(hour, 10);
    if (ampm === "AM") { if (h === 12) h = 0; }
    else { if (h !== 12) h += 12; }
    return `${String(h).padStart(2, "0")}:${min || "00"}`;
  };

  const fmt = (t24) => {
    if (!t24) return "";
    const [hh, mm] = t24.split(":").map(Number);
    return `${hh % 12 || 12}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`;
  };

  const addTime = () => {
    if (!ti.hour) return;
    const t = to24(ti);
    if (!form.times.includes(t)) set("times", [...form.times, t].sort());
    setTi(s => ({ ...s, hour: "", min: "00" }));
  };

  const removeTime = (t) => set("times", form.times.filter(x => x !== t));

  const save = () => {
    if (!form.name.trim()) return setE("Medicine name is required.");
    if (!form.typeIcon) return setE("Please select a medicine type.");
    if (!form.dosage.trim()) return setE("Dosage is required.");
    if (!form.frequency) return setE("Frequency is required.");
    if (form.times.length === 0) return setE("At least one scheduled time is required.");
    if (!form.quantity.trim()) return setE("Inventory quantity is required.");
    if (!form.expiry) return setE("Expiry date is required.");
    if (form.startDate < today) return setE("Start date cannot be in the past.");
    if (form.expiry < today) return setE("Expiry date cannot be in the past.");
    onSave(form);
  };

  const HOUR_OPTS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
  const MIN_OPTS  = ["00","05","10","15","20","25","30","35","40","45","50","55"];

  const PILL_COLORS = [
    "#16A97A", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", 
    "#EC4899", "#06B6D4", "#6B7280"
  ];

  const TYPE_ICONS = [
    { id: "typeTablet", label: "Tablet", u: "tablet(s)", ex: "Paracetamol", dex: "500" },
    { id: "typeCapsule", label: "Capsule", u: "capsule(s)", ex: "Amoxicillin", dex: "1" },
    { id: "typeSyrup", label: "Syrup", u: "ml", ex: "Cough Syrup", dex: "10" },
    { id: "typeInjection", label: "Injection", u: "unit(s)", ex: "Insulin", dex: "15" },
    { id: "typeInhaler", label: "Inhaler", u: "puff(s)", ex: "Salbutamol", dex: "2" },
    { id: "typeDrops", label: "Drops", u: "drops", ex: "Eye Drops", dex: "2" },
    { id: "typeCream", label: "Cream", u: "g", ex: "Hydrocortisone", dex: "1" }
  ];

  const selectType = (type) => {
    setF(f => ({ ...f, typeIcon: type.id, unit: type.u }));
    setE("");
  };

  const selectedType = TYPE_ICONS.find(t => t.id === form.typeIcon);

  return (
    <div className="med-form-scroll">
      {/* ── SECTION: BASICS ── */}
      <div className="med-section-label">Basics</div>
      <div className="field">
        <label htmlFor="med-name">Medicine Name <span style={{ color: "var(--g)" }}>*</span></label>
        <input 
          id="med-name"
          type="text" 
          value={form.name} 
          onChange={e => set("name", e.target.value)} 
          placeholder={selectedType ? `e.g. ${selectedType.ex}` : "e.g. Metformin"} 
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--t2)", textTransform: "uppercase", marginBottom: 10, letterSpacing: ".5px" }}>
          1. Select Medicine Type <span style={{ color: "var(--g)" }}>*</span>
        </label>
        <div className="med-type-grid">
          {TYPE_ICONS.map(type => {
            const Icon = Icons[type.id];
            const sel = form.typeIcon === type.id;
            return (
              <button key={type.id} type="button" className={`med-type-btn${sel ? " sel" : ""}`} onClick={() => selectType(type)}>
                <Icon s={22} />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="field" style={{ opacity: form.typeIcon ? 1 : 0.6, transition: 'opacity 0.2s' }}>
        <label htmlFor="med-dosage">2. Amount / Dosage <span style={{ color: "var(--g)" }}>*</span> {form.typeIcon && <span style={{ textTransform: 'none', color: 'var(--t3)', fontWeight: 400 }}>(in {form.unit})</span>}</label>
        <input 
          id="med-dosage"
          type="text" 
          value={form.dosage} 
          onChange={e => set("dosage", e.target.value)} 
          placeholder={selectedType ? `e.g. ${selectedType.dex}` : "Select a type above first"} 
          disabled={!form.typeIcon}
          style={{ cursor: form.typeIcon ? 'text' : 'not-allowed' }}
        />
        <div style={{ fontSize: "var(--text-xs)", color: "var(--t3)", marginTop: 6 }}>
          {form.typeIcon ? `Enter the value for your ${form.unit}` : "Units will be automatically set based on your selection above."}
        </div>
      </div>

      {/* ── SECTION: VISUAL IDENTIFICATION ── */}
      <div className="med-section-label">Medicine Appearance</div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--t2)", textTransform: "uppercase", marginBottom: 8, letterSpacing: ".5px" }}>Identification Color</label>
        <div className="color-grid">
          {PILL_COLORS.map(c => (
            <div key={c} className={`color-dot${form.pillColor === c ? " sel" : ""}`} style={{ background: c }} onClick={() => set("pillColor", c)} />
          ))}
        </div>
      </div>

      {/* ── SECTION: SCHEDULE ── */}
      <div className="med-section-label">Schedule & Dosing</div>
      
      <div className="field">
        <label>Frequency <span style={{ color: "var(--g)" }}>*</span></label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {FREQ.map(val => (
            <button key={val} type="button" onClick={() => set("frequency", val)} className={`auth-tab${form.frequency === val ? " on" : ""}`} style={{ flex: "none", padding: "8px 14px", borderRadius: 20, fontSize: "var(--text-xs)" }}>{val}</button>
          ))}
        </div>
      </div>

      <div className="field" style={{ marginBottom: 20 }}>
        <label htmlFor="med-start">Start Date <span style={{ color: "var(--g)" }}>*</span></label>
        <input id="med-start" type="date" value={form.startDate} min={today} onChange={e => set("startDate", e.target.value)} />
      </div>

      {/* Scheduled Times */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--t2)", textTransform: "uppercase", marginBottom: 8, letterSpacing: ".5px" }}>
          Scheduled Times <span style={{ color: "var(--g)" }}>*</span>
        </label>
        
        {form.times.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
            {form.times.map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--g)", color: "#fff", borderRadius: 20, padding: "5px 12px", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                {fmt(t)}
                <button type="button" onClick={() => removeTime(t)} style={{ background: "rgba(255,255,255,.25)", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: "var(--text-xs)" }} aria-label={`Remove time ${fmt(t)}`}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 6, alignItems: "center", background: "var(--s2)", borderRadius: 14, padding: "10px", border: "1.5px solid var(--bd)" }}>
          <select value={ti.hour} onChange={e => setTi(s => ({ ...s, hour: e.target.value }))} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1.5px solid var(--bd)", background: "var(--sf)", color: "var(--tx)", textAlign: "center", fontWeight: 700 }}>
            <option value="">HH</option>
            {HOUR_OPTS.map(h => <option key={h} value={h} style={{ background: "var(--s2)", color: "var(--tx)" }}>{h}</option>)}
          </select>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--g)" }}>:</span>
          <select value={ti.min} onChange={e => setTi(s => ({ ...s, min: e.target.value }))} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1.5px solid var(--bd)", background: "var(--sf)", color: "var(--tx)", textAlign: "center", fontWeight: 700 }}>
            {MIN_OPTS.map(m => <option key={m} value={m} style={{ background: "var(--s2)", color: "var(--tx)" }}>{m}</option>)}
          </select>
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1.5px solid var(--bd)" }}>
            {["AM", "PM"].map(p => (
              <button key={p} type="button" onClick={() => setTi(s => ({ ...s, ampm: p }))} style={{ padding: "8px 12px", background: ti.ampm === p ? "var(--g)" : "var(--sf)", color: ti.ampm === p ? "#fff" : "var(--t2)", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "var(--text-xs)" }}>{p}</button>
            ))}
          </div>
          <button type="button" onClick={addTime} disabled={!ti.hour} className="ic-btn" style={{ width: 42, height: 42, background: ti.hour ? "var(--g)" : "var(--s2)", color: ti.hour ? "#fff" : "var(--t2)", borderColor: ti.hour ? "var(--g)" : "var(--bd)" }}>
            <Icons.plus s={20} />
          </button>
        </div>
      </div>

      {/* ── SECTION: INVENTORY ── */}
      <div className="med-section-label">Inventory & Expiry</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label htmlFor="med-qty">Quantity <span style={{ color: "var(--g)" }}>*</span></label>
          <input id="med-qty" type="text" value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="e.g. 30 tablets" />
        </div>
        <div className="field">
          <label htmlFor="med-exp">Expiry Date <span style={{ color: "var(--g)" }}>*</span></label>
          <input id="med-exp" type="date" value={form.expiry} min={today} onChange={e => set("expiry", e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="med-notes">Notes</label>
        <textarea id="med-notes" style={{ resize: "vertical", minHeight: 80 }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="e.g. Take with food, avoid alcohol…" />
      </div>

      {err && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: "var(--text-sm)", fontWeight: 600 }}>
          <Icons.warn /> {err}
        </div>
      )}

      <div className="mod-ac" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-o" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-p" style={{ height: 48 }} onClick={save}>
          {initial ? "Save Changes" : "Add Medicine"}
        </button>
      </div>
    </div>
  );
}
