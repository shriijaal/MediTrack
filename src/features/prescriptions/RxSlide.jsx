import { useState, useEffect } from "react";
import { Slide } from "../../components/common/Slide";
import { Icons } from "../../components/icons/Icons";
import { SvgI } from "../../components/icons/Icons";
import { Modal } from "../../components/common/Modal";
import { getRx, saveRx, getSession } from "../../services/storage";
import { apiFetch } from "../../services/api";
import { API_BASE, uid } from "../../utils/constants";
import { fmtSz } from "../../utils/formatters";
import { mapRx } from "../../utils/mappers";
import { RxViewer } from "./RxViewer";
import { PdfThumb } from "./PdfHelpers";

export function RxSlide({ userId, toast, onBack }) {
  const [rxList, setRx] = useState(() => getRx(userId));
  const [drag, setDrag] = useState(false);
  const [viewing, setView] = useState(null);
  const [pending, setPending] = useState(null);
  const [titleVal, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  // Load prescriptions from backend on mount
  useEffect(() => {
    apiFetch(`/prescriptions.php?patient_id=${userId}`)
      .then(data => {
        // Backend now returns base64 data URL so images display without cross-origin issues
        const mapped = data.map(mapRx);
        setRx(mapped);
        saveRx(userId, mapped);
      })
      .catch(() => { }); // offline — use localStorage
  }, [userId]);

  const syncLocal = r => { setRx(r); saveRx(userId, r); };

  // Step 1 — validate file, read to base64 for preview, open title modal
  const handleFile = file => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) return toast("Only JPG, PNG, WEBP or PDF", "err");
    if (file.size > 10 * 1024 * 1024) return toast("Max 10 MB", "err");
    const reader = new FileReader();
    reader.onload = e => {
      const defaultTitle = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();
      setPending({ file, dataUrl: e.target.result });
      setTitle(defaultTitle);
    };
    reader.readAsDataURL(file);
  };

  // Step 2 — user confirms title → upload to backend, fallback to localStorage
  const confirmUpload = async () => {
    if (!pending) return;
    const finalTitle = titleVal.trim() || pending.file.name;
    setUploading(true);
    try {
      // Try backend upload via multipart form
      const formData = new FormData();
      formData.append("file", pending.file);
      formData.append("title", finalTitle);
      if (userId) formData.append("patient_id", userId);

      const sess = getSession();
      const token = sess?.token;
      // Pass token as query param — avoids Authorization header CORS issues
      const uploadUrl = API_BASE + "/prescriptions.php" + (token ? `?_token=${token}` : "");
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData, // multipart — browser sets Content-Type with boundary
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Upload failed");

      const r = json.data;
      const newEntry = {
        ...mapRx(r),
        // Prefer backend base64 data, fall back to local preview
        data: r.data || pending.dataUrl,
      };
      syncLocal([newEntry, ...rxList]);
      toast("Prescription uploaded!", "ok");
    } catch {
      // Backend offline — save as base64 in localStorage
      syncLocal([{
        id: uid(), title: finalTitle, name: pending.file.name,
        type: pending.file.type, size: pending.file.size,
        data: pending.dataUrl,
        uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      }, ...rxList]);
      toast("Prescription saved locally!", "ok");
    }
    setPending(null);
    setTitle("");
    setUploading(false);
  };

  const cancelUpload = () => { setPending(null); setTitle(""); };

  const del = async id => {
    syncLocal(rxList.filter(r => r.id !== id));
    toast("Removed.", "ok");
    try {
      await apiFetch(`/prescriptions.php?id=${id}&patient_id=${userId}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Prescription delete API failed:", e.message);
      toast("Removed locally — sync failed: " + e.message, "warn");
    }
  };

  const download = rx => {
    // For backend-hosted files, open directly in new tab
    if (!rx.data && rx.url) {
      window.open(rx.url, "_blank");
      toast("Opening file…", "ok");
      return;
    }
    // For local base64 files, trigger download
    const a = document.createElement("a");
    a.href = rx.data;
    a.download = rx.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast("Downloading…", "ok");
  };

  const badge = type => {
    if (type?.includes("pdf")) return { label: "PDF", bg: "#FEE2E2", col: "#DC2626" };
    if (type?.includes("png")) return { label: "PNG", bg: "#EFF6FF", col: "#2563EB" };
    if (type?.includes("jpeg") || type?.includes("jpg")) return { label: "JPG", bg: "#F0FDF4", col: "#16A34A" };
    if (type?.includes("webp")) return { label: "WEBP", bg: "#FFF7ED", col: "#D97706" };
    return { label: "FILE", bg: "var(--s2)", col: "var(--t2)" };
  };

  const triggerPicker = () => document.getElementById("rx-in").click();

  return (
    <>
      <Slide title="Prescriptions" onBack={onBack}
        action={
          <>
            <button className="btn btn-p btn-sm" style={{ width: "auto" }} onClick={triggerPicker}>
              <Icons.upload /> Upload
            </button>
            <input id="rx-in" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
              style={{ display: "none" }}
              onChange={e => { handleFile(e.target.files[0]); e.target.value = ""; }} />
          </>
        }>

        {rxList.length === 0 ? (
          <div className={`dz${drag ? " drag" : ""}`}
            onClick={triggerPicker}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}>
            <div style={{ color: "var(--g)", display: "flex", justifyContent: "center", marginBottom: 10 }}><Icons.upload /></div>
            <strong>Upload a Prescription</strong>
            <p>Drag & drop or tap to browse<br />JPG, PNG, PDF · max 10 MB</p>
          </div>
        ) : (
          <>
            <div className={`dz dz-sm${drag ? " drag" : ""}`} style={{ marginBottom: 16 }}
              onClick={triggerPicker}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}>
              <div style={{ color: "var(--g)", flexShrink: 0 }}><Icons.upload /></div>
              <div><strong style={{ fontSize: "var(--text-sm)" }}>Add prescription</strong><p>Tap or drag a file</p></div>
            </div>

            {rxList.map(rx => {
              const b = badge(rx.type);
              const isImg = rx.type?.includes("image");
              const displayTitle = rx.title || rx.name;
              return (
                <div key={rx.id} className="rx-c" style={{
                  flexDirection: "column", gap: 0, padding: 0,
                  overflow: "hidden",
                  /* Critical: card must not grow wider than its container */
                  minWidth: 0, width: "100%", boxSizing: "border-box",
                }}>
                  {/* Preview strip */}
                  {isImg && (
                    <div className="rx-preview-strip" onClick={() => setView(rx)}>
                      <img
                        src={rx.data || rx.url}
                        alt={displayTitle}
                        className="rx-preview-img"
                        onError={e => {
                          // If image fails, show a placeholder
                          e.target.style.display = "none";
                          e.target.parentNode.style.background = "#1a1a2e";
                        }}
                      />
                      <div className="rx-preview-overlay">
                        <Icons.eye /><span>Tap to view</span>
                      </div>
                    </div>
                  )}
                  {!isImg && (
                    <div
                      onClick={() => setView(rx)}
                      style={{
                        position: "relative", width: "100%", height: 180,
                        overflow: "hidden", cursor: "pointer",
                        background: "#1a1a2e",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      {/* Full-width PDF page-1 canvas */}
                      <PdfThumb dataUrl={rx.data || rx.url} size={180} fullWidth />
                      {/* Dark overlay with label */}
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        padding: "10px 14px",
                        background: "linear-gradient(to top, rgba(10,15,30,.85) 0%, transparent 100%)",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <span style={{
                          fontSize: "var(--text-xs)", fontWeight: 800, background: "#DC2626", color: "#fff",
                          borderRadius: 4, padding: "2px 6px", letterSpacing: ".4px", flexShrink: 0,
                        }}>PDF</span>
                        <span style={{
                          color: "#fff", fontSize: "var(--text-sm)", fontWeight: 600,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          flex: 1, minWidth: 0,
                        }}>{displayTitle}</span>
                        <div style={{ color: "rgba(255,255,255,.8)", flexShrink: 0, display: "flex" }}>
                          <Icons.eye />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info + actions */}
                  <div style={{ padding: "12px 14px", minWidth: 0 }}>
                    {/* Top row: badge + title */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, minWidth: 0 }}>
                      {/* Badge — fixed width, never shrinks */}
                      <span style={{
                        fontSize: "var(--text-xs)", fontWeight: 700, padding: "3px 8px", borderRadius: 8,
                        background: b.bg, color: b.col, flexShrink: 0, marginTop: 2,
                        whiteSpace: "nowrap",
                      }}>{b.label}</span>
                      {/* Text block — flex:1 0 0 forces it to shrink */}
                      <div style={{ flex: "1 1 0", minWidth: 0, overflow: "hidden" }}>
                        <div title={displayTitle} style={{
                          fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "var(--text-sm)",
                          lineHeight: 1.35,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>{displayTitle}</div>
                        {rx.title && rx.title !== rx.name && (
                          <div title={rx.name} style={{
                            fontSize: "var(--text-xs)", color: "var(--t3)", marginTop: 2,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>{rx.name}</div>
                        )}
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--t3)", marginTop: 3 }}>
                          {fmtSz(rx.size)} · {rx.uploadedAt}
                        </div>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="rx-btn" title="View"
                        style={{ flex: 1, width: "auto", borderRadius: 10, height: 36, fontSize: "var(--text-xs)", fontWeight: 600, fontFamily: "'Syne',sans-serif", color: "var(--g)", borderColor: "var(--gm)", background: "var(--gl)" }}
                        onClick={() => setView(rx)}>
                        <Icons.eye />
                        <span style={{ marginLeft: 5 }}>View</span>
                      </button>
                      <button className="rx-btn" title="Download"
                        style={{ flex: 1, width: "auto", borderRadius: 10, height: 36, fontSize: "var(--text-xs)", fontWeight: 600, fontFamily: "'Syne',sans-serif" }}
                        onClick={() => download(rx)}>
                        <SvgI d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        <span style={{ marginLeft: 5 }}>Download</span>
                      </button>
                      <button className="rx-btn del" title="Delete"
                        style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}
                        onClick={() => del(rx.id)}>
                        <Icons.trash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Slide>

      {/* ── Title entry modal (shown after file is picked) ── */}
      {pending && (
        <Modal title="Name Your Prescription" onClose={cancelUpload}>
          {/* Preview thumbnail */}
          <div style={{
            width: "100%", height: 120, borderRadius: 12, overflow: "hidden",
            background: "var(--s2)", marginBottom: 18, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            {pending.file.type.includes("image") ? (
              <img src={pending.dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 6 }}>📄</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--t2)", fontWeight: 500 }}>{pending.file.name}</div>
              </div>
            )}
          </div>

          <div className="field">
            <label>Prescription Title</label>
            <input
              value={titleVal}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Blood Pressure Prescription"
              autoFocus
              onKeyDown={e => e.key === "Enter" && confirmUpload()}
              maxLength={80}
            />
            <div style={{ fontSize: "var(--text-xs)", color: "var(--t3)", marginTop: 5 }}>
              Give it a meaningful name so you can find it easily later.
            </div>
          </div>

          <div style={{ fontSize: "var(--text-xs)", color: "var(--t3)", marginBottom: 4 }}>
            File: <span style={{ color: "var(--t2)", fontWeight: 500 }}>{pending.file.name}</span> · {fmtSz(pending.file.size)}
          </div>

          <div className="mod-ac">
            <button className="btn btn-o" onClick={cancelUpload}>Cancel</button>
            <button className="btn btn-p" onClick={confirmUpload} disabled={uploading}>
              {uploading ? "Uploading…" : "Save Prescription"}
            </button>
          </div>
        </Modal>
      )}

      {/* Viewer */}
      {viewing && (
        <RxViewer
          rx={{ ...viewing, name: viewing.title || viewing.name }}
          onClose={() => setView(null)}
          onDownload={() => download(viewing)}
        />
      )}
    </>
  );
}
