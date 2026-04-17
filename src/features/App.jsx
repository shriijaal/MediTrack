import { useState, useEffect, useRef } from "react";
import { Icons } from "../components/icons/Icons";
import { Toast } from "../components/common/Toast";
import { Modal } from "../components/common/Modal";
import { getSession, clearSess, getMeds, saveMeds, getDoseLog, getSeenNotifs, getFiredNotifs, saveFiredNotifs } from "../services/storage";
import { apiFetch } from "../services/api";
import { uid } from "../utils/constants";
import { AuthScreen } from "./auth/AuthScreen";
import { Dashboard } from "./dashboard/Dashboard";
import { MedsTab } from "./medicines/MedsTab";
import { MedsSlide } from "./medicines/MedsSlide";
import { MedForm } from "./medicines/MedForm";
import { ConfirmDel } from "./medicines/ConfirmDel";
import { RxSlide } from "./prescriptions/RxSlide";
import { ReportsSlide } from "./reports/ReportsSlide";
import { ExpirySlide } from "./expiry/ExpirySlide";
import { SearchPage } from "./search/SearchPage";
import { RxViewer } from "./prescriptions/RxViewer";
import { ProfileTab } from "./profile/ProfileTab";
import { NotificationsSlide } from "./notifications/NotificationsSlide";
import { buildNotifications } from "./notifications/notificationUtils.jsx";

export function App() {
  const [user, setUser] = useState(() => {
    const sess = getSession();
    // If session exists but has no token (old localStorage-only session),
    // clear it so the user logs in properly through the backend
    if (sess && !sess.token) {
      clearSess();
      return null;
    }
    return sess;
  });
  const [tab, setTab] = useState("home");
  const [slide, setSlide] = useState(null);
  const [toast, setToast] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchRx, setSearchRx] = useState(null);
  const [navHidden, setNavHidden] = useState(false);
  // Caretaker: which patient is currently being viewed (null = own data)
  const [activePatient, setActivePatient] = useState(null);
  const lastScrollY = useRef(null);
  const [refresh, setRefresh] = useState(0);
  const [canGoHome, setCanGoHome] = useState(false);

  const goTab = (t, fromHome = false) => {
    setTab(t);
    setCanGoHome(fromHome);
    setSlide(null);
    setSearchOpen(false);
    setNavHidden(false);
    lastScrollY.current = 0;
  };

  const showToast = (msg, type = "ok") => setToast({ msg, type, key: Date.now() });
  const handleLogin = u => { setUser(u); setTab("home"); };
  const handleLogout = () => { clearSess(); setUser(null); };

  // Hide mobile nav on scroll down, show on scroll up
  const mainColRef = useRef(null);
  useEffect(() => {
    const col = mainColRef.current;
    if (!col) return;
    const onScroll = e => {
      const target = e.target;
      const y = target.scrollTop ?? 0;
      
      if (lastScrollY.current === null) {
        lastScrollY.current = y;
        return;
      }

      const delta = y - lastScrollY.current;
      
      // If scrolling up SIGNIFICANTLY or near top, show nav immediately
      if (delta < -2 || y < 20) {
        setNavHidden(false);
        lastScrollY.current = y;
      } 
      // If scrolling down significantly past threshold, hide nav
      else if (delta > 12 && y > 60) {
        setNavHidden(true);
        lastScrollY.current = y;
      }
    };
    // Listen on capture phase to catch scroll from any child (.cnt, .sl-bd, etc.)
    col.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => col.removeEventListener("scroll", onScroll, { capture: true });
  }, [user]);

  // ── In-app browser reminder system ──────────────────────────────
  // Works on localhost - uses browser Notification API (no VAPID/HTTPS needed)
  useEffect(() => {
    if (!user) return;

    // Ask for permission once
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const meds = getMeds(user.id);
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const dow = now.getDay();

      const firedRaw = getFiredNotifs(user.id);
      const fired = firedRaw[todayStr] || [];
      const newFired = [...fired];
      let changed = false;

      meds.forEach(m => {
        if (!m.times || !m.times.length) return;
        const freq = (m.frequency || "").toLowerCase();
        if (freq === "as needed") return;
        if (freq === "weekly" && dow !== 1) return;

        const doseLog = getDoseLog(user.id, todayStr);

        m.times.forEach(t => {
          const parts = t.split(":");
          const medMins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          const diff = medMins - nowMins;
          const fireKey = m.id + "_" + t;

          // Skip if already logged (taken or missed)
          if (doseLog[m.id + "_" + t]) return;

          // Upcoming dose: 0-5 min window
          if (diff >= 0 && diff <= 5 && !fired.includes(fireKey)) {
            const title = diff === 0
              ? "Time to take " + m.name
              : m.name + " in " + diff + " minute" + (diff > 1 ? "s" : "");
            const body = m.dosage + " " + m.unit + " - " + m.frequency;
            try {
              const n = new Notification("MediTrack: " + title, { body, tag: fireKey, icon: "/favicon.ico" });
              setTimeout(() => n.close(), 8000);
            } catch {
              // Ignore if notification fails (e.g. permission revoked or not supported)
            }
            newFired.push(fireKey);
            changed = true;
          }

          // Missed dose: 30-120 min overdue, not yet logged
          const missedKey = "missed_" + fireKey;
          if (diff < -30 && diff > -120 && !fired.includes(missedKey)) {
            try {
              new Notification("MediTrack: Did you take " + m.name + "?", {
                body: "Scheduled at " + t + " - mark it as taken or missed",
                tag: missedKey,
                icon: "/favicon.ico",
              });
            } catch {
              // Ignore if notification fails
            }
            newFired.push(missedKey);
            changed = true;
          }
        });
      });

      if (changed) {
        // Only keep today to avoid localStorage bloat
        saveFiredNotifs(user.id, { [todayStr]: newFired });
      }
    };

    // Check immediately, then every 60 seconds
    checkReminders();
    const iv = setInterval(checkReminders, 60_000);
    return () => clearInterval(iv);
  }, [user]);

  // Save a new medicine from the FAB modal
  const handleFabAdd = async form => {
    const eId = activePatient?.id || user.id;
    const newMed = { ...form, id: uid(), createdAt: Date.now() };
    // Save to localStorage
    const meds = getMeds(eId);
    saveMeds(eId, [newMed, ...meds]);
    setAddModal(false);
    setFabOpen(false);
    setRefresh(r => r + 1);
    showToast("Medicine added!", "ok");
    // Also save to backend
    try {
      const payload = activePatient ? { ...form, patient_id: activePatient.id } : form;
      await apiFetch("/medicines.php", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch { /* offline — localStorage already updated */ }
  };

  const NAV = [
    { id: "home", label: "Home", Icon: Icons.navHome },
    { id: "medicines", label: "Medicines", Icon: Icons.navMeds },
    { id: "profile", label: "Profile", Icon: Icons.navProfile },
  ];

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {!user ? <AuthScreen onLogin={handleLogin} /> : (
        <div className="app-shell">
          <div className="app">
            {/* app-inner: position:relative, no overflow:hidden — FAB anchors here */}
            <div className="app-inner">

              {/* ── Content column ── */}
              <div className="main-col" ref={mainColRef}>

                {/* Header — only shown when search is closed to avoid duplication on mobile */}
                {!searchOpen && (
                  <div className="hdr">
                    {activePatient && (
                      <div style={{
                        background: "linear-gradient(90deg, #1E3A8A, #1E40AF)",
                        color: "#fff",
                        padding: "10px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        borderBottom: "1px solid rgba(255,255,255,.1)",
                      }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* People icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <div>
                          <span style={{ opacity: .8, fontWeight: 500 }}>Viewing as Caretaker for </span>
                          <span style={{ fontWeight: 800, fontSize: "var(--text-sm)" }}>{activePatient.name}</span>
                          {activePatient.email && (
                            <span style={{ opacity: .65, fontWeight: 400, marginLeft: 6, fontSize: "var(--text-xs)" }}>({activePatient.email})</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setActivePatient(null)}
                        style={{
                          background: "rgba(255,255,255,.2)",
                          border: "1.5px solid rgba(255,255,255,.4)",
                          borderRadius: 8,
                          color: "#fff",
                          padding: "4px 12px",
                          fontSize: "var(--text-xs)",
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}>
                        ✕ Exit
                      </button>
                    </div>
                  )}

                  <div className="hdr-row">
                    {/* Left: greeting (mobile) / empty (desktop — space taken by search) */}
                    <div className="hdr-mobile-greet">
                      <div className="hdr-g">{activePatient ? "Caretaker mode" : greet + ","}</div>
                      <div className="hdr-n">{activePatient ? activePatient.name : user.name.split(" ")[0] + " 👋"}</div>
                    </div>

                    {/* Search bar — shown inline on tablet/desktop */}
                    <div className="hdr-search"
                      onClick={() => { setSearchOpen(true); setFabOpen(false); }}
                      style={{ cursor: "text" }}>
                      <Icons.search />
                      <input
                        readOnly
                        placeholder="Search medicines, prescriptions…"
                        style={{ cursor: "text" }}
                        onClick={() => { setSearchOpen(true); setFabOpen(false); }}
                      />
                    </div>

                    {/* Right: actions */}
                    <div className="hdr-actions">
                      {/* Mobile search icon */}
                      <button className="ic-btn hdr-mobile-search" title="Search"
                        onClick={() => { setSearchOpen(true); setFabOpen(false); }}>
                        <Icons.search />
                      </button>

                      {/* Bell */}
                      <div style={{ position: "relative" }}>
                        <button className="hdr-ic-btn" onClick={() => { setSlide("notifications"); setFabOpen(false); }}>
                          <Icons.bell />
                          {(() => {
                            const notes = buildNotifications(user.id);
                            const seen = getSeenNotifs(user.id);
                            const count = notes.filter(n => !seen.includes(n.id)).length;
                            return count > 0
                              ? <div className="hdr-bell-badge">{count > 9 ? "9+" : count}</div>
                              : null;
                          })()}
                        </button>
                      </div>

                      {/* Avatar + name */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="hdr-avatar">{user.name[0].toUpperCase()}</div>
                        <span className="hdr-user-name">{user.name.split(" ")[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                {/* Page content */}
                {/* effectiveId = patient's id when caretaker is viewing a patient */}
                {(() => {
                  const eId = activePatient?.id || user.id;
                  const isCtk = !!activePatient;
                  return (<>
                    {tab === "home" && <Dashboard key={refresh} userId={eId} onMeds={() => goTab("medicines", true)} onRx={() => setSlide("rx")} onExpiry={() => setSlide("expiry")} onReports={() => setSlide("reports")} />}
                    {tab === "medicines" && <MedsTab userId={eId} toast={showToast} caretakerPatientId={isCtk ? eId : null} onBack={canGoHome ? () => goTab("home") : null} />}
                    {tab === "profile" && <ProfileTab user={user} userId={user.id} onLogout={handleLogout} onOpenRx={() => setSlide("rx")} onSwitchPatient={p => { setActivePatient(p); setTab("home"); }} activePatient={activePatient} onBack={canGoHome ? () => goTab("home") : null} />}

                    {/* Slide pages */}
                    {slide === "meds" && <MedsSlide userId={eId} toast={showToast} caretakerPatientId={isCtk ? eId : null} onBack={() => { setSlide(null); setRefresh(r => r + 1); }} />}
                    {slide === "rx" && <RxSlide userId={eId} toast={showToast} onBack={() => setSlide(null)} readOnly={false} />}
                    {slide === "expiry" && <ExpirySlide userId={eId} onBack={() => setSlide(null)} />}
                    {slide === "reports" && <ReportsSlide userId={eId} onBack={() => setSlide(null)} />}
                    {slide === "notifications" && <NotificationsSlide userId={user.id} onBack={() => setSlide(null)} />}
                  </>);
                })()}

                {/* Search page */}
                {searchOpen && (
                  <SearchPage
                    userId={user.id}
                    onBack={() => { setSearchOpen(false); setSearchRx(null); }}
                    onViewRx={rx => setSearchRx(rx)}
                  />
                )}

                {/* Prescription viewer opened from search */}
                {searchRx && (
                  <RxViewer
                    rx={{ ...searchRx, name: searchRx.title || searchRx.name }}
                    onClose={() => setSearchRx(null)}
                    onDownload={() => {
                      const a = document.createElement("a");
                      a.href = searchRx.data; a.download = searchRx.name;
                      document.body.appendChild(a); a.click();
                      document.body.removeChild(a);
                      showToast("Downloading…", "ok");
                    }}
                  />
                )}

                {/* Add medicine modal */}
                {addModal && (
                  <Modal title="Add Medicine" onClose={() => setAddModal(false)}>
                    <MedForm onSave={handleFabAdd} onClose={() => setAddModal(false)} />
                  </Modal>
                )}

              </div>{/* end main-col */}

              {/* ── Nav: bottom bar on mobile, dark sidebar on tablet/desktop ── */}
              {/* ── Nav: bottom bar on mobile, dark sidebar on tablet/desktop ── */}
              <nav className={`bnav${navHidden ? " nav-hidden" : ""}`}>
                {/* Logo — hidden on mobile via CSS */}
                <div className="bnav-logo">
                  <span className="bnav-logo-text">MediTrack</span>
                </div>

                {/* All nav items — Home, Medicines */}
                {NAV.filter(n => n.id !== "profile").map(n => (
                  <button key={n.id}
                    className={`nit${tab === n.id ? " on" : ""}`}
                    onClick={() => goTab(n.id)}>
                    <n.Icon active={tab === n.id} />
                    <span className="nit-label">{n.label}</span>
                  </button>
                ))}

                <div className="bnav-spacer" />

                {/* Profile — pinned to bottom on desktop */}
                {NAV.filter(n => n.id === "profile").map(n => (
                  <button key={n.id}
                    className={`nit nit-profile${tab === n.id ? " on" : ""}`}
                    onClick={() => goTab(n.id)}>
                    <n.Icon active={tab === n.id} />
                    <span className="nit-label">{n.label}</span>
                  </button>
                ))}


              </nav>

              {/* ── FAB: anchored to app-inner, home tab only ── */}
              {tab === "home" && (
                <>
                  {fabOpen && (
                    <div onClick={() => setFabOpen(false)}
                      style={{ position: "absolute", inset: 0, zIndex: 59 }} />
                  )}
                  {fabOpen && (
                    <div className="fab-menu">
                      <div className="fab-item" style={{ animationDelay: "0ms" }}>
                        <span className="fab-item-lbl">Add Medicine</span>
                        <button className="fab-item-btn"
                          style={{ background: "linear-gradient(135deg,var(--g),var(--g2))" }}
                          onClick={() => { setFabOpen(false); setAddModal(true); }}>
                          <Icons.pill />
                        </button>
                      </div>
                      <div className="fab-item" style={{ animationDelay: "55ms" }}>
                        <span className="fab-item-lbl">Upload Prescription</span>
                        <button className="fab-item-btn"
                          style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}
                          onClick={() => { setFabOpen(false); setSlide("rx"); }}>
                          <Icons.rx />
                        </button>
                      </div>
                    </div>
                  )}
                  <button className={`fab${fabOpen ? " open" : ""}`}
                    onClick={() => setFabOpen(o => !o)} title="Quick actions">
                    <Icons.plus />
                  </button>
                </>
              )}

            </div>{/* end app-inner */}

            {/* ── Nav hidden hint — mobile only, fixed at bottom ── */}
            {navHidden && (
              <div className="nav-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                Scroll up to show navigation
              </div>
            )}
          </div>{/* end app */}
        </div>   /* end app-shell */
      )}
    </>
  );
}
