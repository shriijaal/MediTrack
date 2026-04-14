import { useState } from "react";
import { Icons } from "../../components/icons/Icons";
import { FREQ, UNITS } from "../../utils/constants";

export function MedForm({ initial, onSave, onClose }) {
  const blank = { name: "", dosage: "", unit: "mg", frequency: "Once daily", times: [], quantity: "", expiry: "", notes: "" };
  const [form, setF] = useState(() => initial ? { ...initial } : { ...blank });
  const [ti, setTi] = useState({ hour: "", min: "00", ampm: "AM" });
  const [err, setE] = useState("");

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
    if (!form.dosage.trim()) return setE("Dosage is required.");
    if (!form.quantity.trim()) return setE("Quantity is required.");
    onSave(form);
  };

  const HOUR_OPTS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
  const MIN_OPTS  = ["00","05","10","15","20","25","30","35","40","45","50","55"];

  const fieldStyle = {
    width: "100%", padding: "11px 13px",
    border: "1.5px solid var(--bd)", borderRadius: 10,
    fontFamily: "'DM Sans',sans-serif", fontSize: 14,
    color: "var(--tx)", background: "var(--sf)", outline: "none",
    boxSizing: "border-box", display: "block", transition: "border-color .15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Medicine Name */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>
          Medicine Name <span style={{ color: "var(--g)" }}>*</span>
        </label>
        <input type="text" style={fieldStyle} value={form.name}
          onChange={e => set("name", e.target.value)} placeholder="e.g. Metformin" autoComplete="off"
          onFocus={e => e.target.style.borderColor = "var(--g)"}
          onBlur={e => e.target.style.borderColor = "var(--bd)"} />
      </div>

      {/* Dosage + Unit */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>
            Dosage <span style={{ color: "var(--g)" }}>*</span>
          </label>
          <input type="text" style={fieldStyle} value={form.dosage}
            onChange={e => set("dosage", e.target.value)} placeholder="e.g. 500" autoComplete="off"
            onFocus={e => e.target.style.borderColor = "var(--g)"}
            onBlur={e => e.target.style.borderColor = "var(--bd)"} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>Unit</label>
          <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.unit}
            onChange={e => set("unit", e.target.value)}
            onFocus={e => e.target.style.borderColor = "var(--g)"}
            onBlur={e => e.target.style.borderColor = "var(--bd)"}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Frequency */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>Frequency</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {FREQ.map(val => {
            const active = form.frequency === val;
            return (
              <button key={val} type="button" onClick={() => set("frequency", val)} style={{
                padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                border: active ? "2px solid var(--g)" : "1.5px solid var(--bd)",
                background: active ? "var(--gl)" : "var(--sf)",
                color: active ? "var(--g)" : "var(--t2)",
                fontFamily: "'DM Sans',sans-serif", fontSize: 12.5,
                fontWeight: active ? 700 : 500, transition: "all .15s",
              }}>{val}</button>
            );
          })}
        </div>
      </div>

      {/* Scheduled Times */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
          Scheduled Times
          {form.times.length > 0 && (
            <span style={{ marginLeft: 8, background: "var(--g)", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700, verticalAlign: "middle" }}>
              {form.times.length}
            </span>
          )}
        </label>
        {form.times.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
            {form.times.map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--g)", color: "#fff", borderRadius: 20, padding: "5px 10px 5px 12px", fontSize: 13, fontWeight: 600 }}>
                {fmt(t)}
                <button type="button" onClick={() => removeTime(t)} style={{ background: "rgba(255,255,255,.25)", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: 11, lineHeight: 1, flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 6, alignItems: "center", background: "var(--s2)", borderRadius: 12, padding: "10px 12px", border: "1.5px solid var(--bd)" }}>
          <select value={ti.hour} onChange={e => setTi(s => ({ ...s, hour: e.target.value }))}
            style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "1.5px solid var(--bd)", background: "var(--sf)", fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: ti.hour ? "var(--tx)" : "var(--t3)", textAlign: "center", fontWeight: 600, cursor: "pointer", outline: "none" }}>
            <option value="">HH</option>
            {HOUR_OPTS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--g)", flexShrink: 0 }}>:</span>
          <select value={ti.min} onChange={e => setTi(s => ({ ...s, min: e.target.value }))}
            style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "1.5px solid var(--bd)", background: "var(--sf)", fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--tx)", textAlign: "center", fontWeight: 600, cursor: "pointer", outline: "none" }}>
            {MIN_OPTS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1.5px solid var(--bd)", flexShrink: 0 }}>
            {["AM", "PM"].map(p => (
              <button key={p} type="button" onClick={() => setTi(s => ({ ...s, ampm: p }))} style={{ padding: "8px 10px", background: ti.ampm === p ? "var(--g)" : "var(--sf)", color: ti.ampm === p ? "#fff" : "var(--t3)", border: "none", cursor: "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, transition: "all .15s" }}>{p}</button>
            ))}
          </div>
          <button type="button" onClick={addTime} disabled={!ti.hour} style={{ padding: "8px 14px", borderRadius: 8, flexShrink: 0, background: ti.hour ? "var(--g)" : "var(--bd)", color: ti.hour ? "#fff" : "var(--t3)", border: "none", cursor: ti.hour ? "pointer" : "not-allowed", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, transition: "all .15s" }}>
            + Add
          </button>
        </div>
        {form.times.length === 0 && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 6, paddingLeft: 2 }}>Select a time above and tap + Add.</div>}
      </div>

      {/* Quantity + Expiry */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>Quantity <span style={{ color: "var(--g)" }}>*</span></label>
          <input type="text" style={fieldStyle} value={form.quantity}
            onChange={e => set("quantity", e.target.value)} placeholder="e.g. 30 tablets" autoComplete="off"
            onFocus={e => e.target.style.borderColor = "var(--g)"}
            onBlur={e => e.target.style.borderColor = "var(--bd)"} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>Expiry Date</label>
          <input type="date" style={fieldStyle} value={form.expiry}
            onChange={e => set("expiry", e.target.value)}
            onFocus={e => e.target.style.borderColor = "var(--g)"}
            onBlur={e => e.target.style.borderColor = "var(--bd)"} />
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 4 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--t2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>Notes</label>
        <textarea style={{ ...fieldStyle, resize: "vertical", minHeight: 70, lineHeight: 1.6 }}
          value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="e.g. Take with food, avoid alcohol…"
          onFocus={e => e.target.style.borderColor = "var(--g)"}
          onBlur={e => e.target.style.borderColor = "var(--bd)"} />
      </div>

      {err && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--rl)", color: "var(--r)", borderRadius: 10, padding: "10px 14px", marginTop: 8, fontSize: 13, fontWeight: 500 }}>
          <Icons.warn /> {err}
        </div>
      )}

      <div className="mod-ac" style={{ marginTop: 18 }}>
        <button type="button" className="btn btn-o" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-p" onClick={save}>
          {initial ? "Save Changes" : "Add Medicine"}
        </button>
      </div>
    </div>
  );
}
