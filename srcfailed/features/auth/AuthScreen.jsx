import { useState, useEffect } from "react";
import { Icons } from "../../components/icons/Icons";
import { getUsers, saveUsers, saveSession } from "../../services/storage";
import { apiFetch } from "../../services/api";
import { API_BASE } from "../../utils/constants";

export function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Patient" });
  const [showPw, setSp] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendOk, setBackendOk] = useState(null); // null=checking, true=ok, false=offline
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(""); };

  // Check backend status on mount — use no-cors ping so it works even before CORS is fully configured
  useEffect(() => {
    // Try fetching test.php — use no-cors so any response (even without CORS headers) counts as online
    fetch(API_BASE + "/test.php", { mode: "no-cors" })
      .then(() => {
        // Got a response (opaque in no-cors mode) — server is up, now do a real CORS check
        return fetch(API_BASE + "/test.php");
      })
      .then(r => r.json())
      .then(j => setBackendOk(j.ok === true))
      .catch(() => {
        // First fetch failed entirely (server not running), or second failed (CORS not configured yet)
        // Try one more time with just a HEAD request
        fetch(API_BASE + "/test.php", { method: "HEAD", mode: "no-cors" })
          .then(() => setBackendOk(true))
          .catch(() => setBackendOk(false));
      });
  }, []);

  const login = async () => {
    if (!form.email.includes("@")) return setErr("Enter a valid email.");
    if (!form.password) return setErr("Password is required.");
    setLoading(true); setErr(""); setInfo("");
    try {
      const data = await apiFetch("/auth.php?action=login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const u = { ...data.user, token: data.token };
      saveSession(u); onLogin(u);
    } catch (e) {
      // Only fall back to localStorage if backend is confirmed offline
      if (!backendOk) {
        const u = getUsers().find(u => u.email === form.email && u.password === form.password);
        if (!u) return setErr("Invalid email or password.");
        setInfo("⚠️ Offline mode — caretaker features won't work.");
        saveSession(u); onLogin(u);
      } else {
        setErr(e.message || "Login failed. Check your email and password.");
      }
    } finally { setLoading(false); }
  };

  const signup = async () => {
    if (!form.name.trim()) return setErr("Name is required.");
    if (!form.email.includes("@")) return setErr("Enter a valid email.");
    if (form.password.length < 6) return setErr("Password must be at least 6 characters.");
    setLoading(true); setErr(""); setInfo("");
    try {
      const data = await apiFetch("/auth.php?action=register", {
        method: "POST",
        body: JSON.stringify({ name: form.name.trim(), email: form.email, password: form.password, role: form.role }),
      });
      const u = { ...data.user, token: data.token };
      saveSession(u); onLogin(u);
    } catch (e) {
      // Only fall back if backend is offline
      if (!backendOk) {
        const users = getUsers();
        if (users.find(u => u.email === form.email)) return setErr("Email already registered.");
        const u = { id: Math.random().toString(36).slice(2), name: form.name.trim(), email: form.email, password: form.password, role: form.role, createdAt: Date.now() };
        saveUsers([...users, u]); saveSession(u);
        setInfo("⚠️ Offline mode — caretaker features won't work until backend is connected.");
        onLogin(u);
      } else {
        setErr(e.message || "Registration failed. This email may already be registered.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-logo">
        <h1>Medi<span>Track</span></h1>
      </div>

      {/* Backend status indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
        marginBottom: 12, fontSize: 12, fontWeight: 600,
        color: backendOk === null ? "var(--t3)" : backendOk ? "#16A34A" : "#D97706",
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: backendOk === null ? "var(--t3)" : backendOk ? "#16A34A" : "#D97706",
        }} />
        {backendOk === null ? "Checking server…" : backendOk ? "Server connected" : "Server offline — connect XAMPP to use caretaker features"}
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button className={`auth-tab${tab === "login" ? " on" : ""}`} onClick={() => { setTab("login"); setErr(""); setInfo(""); }}>Sign In</button>
          <button className={`auth-tab${tab === "signup" ? " on" : ""}`} onClick={() => { setTab("signup"); setErr(""); setInfo(""); }}>Create Account</button>
        </div>
        {tab === "signup" && <div className="field"><label>Full Name</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your full name" /></div>}
        <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@email.com" /></div>
        <div className="field">
          <label>Password</label>
          <div className="pw-wrap">
            <input type={showPw ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder={tab === "signup" ? "Min. 6 characters" : "Your password"} />
            <button className="pw-tog" onClick={() => setSp(s => !s)}>{showPw ? <Icons.eyeOff /> : <Icons.eye />}</button>
          </div>
        </div>
        {tab === "signup" && (
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={e => set("role", e.target.value)}>
              <option value="Patient">Patient</option>
              <option value="Caretaker">Caretaker</option>
            </select>
          </div>
        )}
        {err && <div className="ferr"><Icons.warn /> {err}</div>}
        {info && <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "var(--al)", color: "#92400E", borderRadius: 10, padding: "10px 14px", marginTop: 8, fontSize: 13 }}>{info}</div>}
        <button className="btn btn-p" style={{ marginTop: 20 }} onClick={tab === "login" ? login : signup} disabled={loading}>
          {loading ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
        </button>
        {tab === "login" && (
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--t3)" }}>
            No account? <button onClick={() => setTab("signup")} style={{ background: "none", border: "none", color: "var(--g)", fontWeight: 600, cursor: "pointer" }}>Sign up free</button>
          </p>
        )}
      </div>
    </div>
  );
}
