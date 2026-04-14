import { useState, useEffect, useRef } from "react";
import { loadPdfJs, getPdfSource } from "./pdfUtils";

// ── PDF Thumbnail — renders page 1 of a PDF onto a canvas ──────
export function PdfThumb({ dataUrl, size = 58, fullWidth = false }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!dataUrl) return;
    let cancelled = false;

    const render = async () => {
      try {
        const pdfjsLib = await loadPdfJs();
        if (cancelled) return;

        const source = getPdfSource(dataUrl);
        const pdf = await pdfjsLib.getDocument(source).promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled || !canvasRef.current) return;

        const vp0 = page.getViewport({ scale: 1 });

        let scale;
        if (fullWidth && wrapRef.current) {
          // Fill the container width at 2× for retina
          const w = wrapRef.current.offsetWidth || 320;
          scale = (w * 2) / vp0.width;
        } else {
          // Fit the square thumbnail
          scale = (size * 2) / Math.max(vp0.width, vp0.height);
        }

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [dataUrl, size, fullWidth]);

  if (fullWidth) {
    // Banner mode — fills parent width, natural height
    return (
      <div ref={wrapRef} style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        overflow: "hidden", position: "relative",
      }}>
        {!ready && !failed && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8,
            background: "#1a1a2e", color: "rgba(255,255,255,.4)",
          }}>
            <div style={{ width: 32, height: 32, border: "2.5px solid rgba(255,255,255,.1)", borderTopColor: "var(--g)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <span style={{ fontSize: 12 }}>Loading PDF…</span>
          </div>
        )}
        {failed && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 6, width: "100%", height: "100%",
            background: "#1a1a2e", color: "rgba(255,255,255,.4)",
          }}>
            <span style={{ fontSize: 36 }}>📄</span>
            <span style={{ fontSize: 12 }}>PDF preview unavailable</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{
            width: "100%", display: "block",
            opacity: ready ? 1 : 0,
            transition: "opacity .3s",
          }}
        />
      </div>
    );
  }

  // Square thumbnail mode
  if (failed) return (
    <div style={{ width: size, height: size, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FEE2E2", borderRadius: 8, gap: 2 }}>
      <span style={{ fontSize: 22 }}>📄</span>
      <span style={{ fontSize: 8, fontWeight: 800, color: "#DC2626", letterSpacing: ".5px" }}>PDF</span>
    </div>
  );

  return (
    <div style={{
      width: size, height: size,
      borderRadius: 8, overflow: "hidden",
      background: "#f5f5f5", position: "relative",
      flexShrink: 0, display: "block",
    }}>
      {!ready && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, background: "#FEE2E2" }}>
          <span style={{ fontSize: size > 80 ? 26 : 18 }}>📄</span>
          {size > 60 && <span style={{ fontSize: 8, fontWeight: 800, color: "#DC2626", letterSpacing: ".5px" }}>PDF</span>}
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          objectFit: "cover", display: "block",
          opacity: ready ? 1 : 0,
          transition: "opacity .2s",
        }}
      />
      {ready && (
        <div style={{ position: "absolute", bottom: 2, right: 2, background: "#DC2626", color: "#fff", fontSize: 7, fontWeight: 800, padding: "1px 4px", borderRadius: 3, letterSpacing: ".4px", zIndex: 1 }}>PDF</div>
      )}
    </div>
  );
}

// ── PDF.js full viewer ───────────────────────────────────────────
export function PdfViewer({ dataUrl }) {
  const containerRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.4);

  useEffect(() => {
    if (!dataUrl) return;
    let cancelled = false;
    let currentContainer = containerRef.current;

    const render = async () => {
      try {
        setLoading(true);
        setError(null);

        const pdfjsLib = await loadPdfJs();
        if (cancelled) return;

        const pdfDoc = await pdfjsLib.getDocument(getPdfSource(dataUrl)).promise;
        if (cancelled) return;

        setNumPages(pdfDoc.numPages);

        const canvases = [];
        for (let p = 1; p <= pdfDoc.numPages; p++) {
          const page = await pdfDoc.getPage(p);
          if (cancelled) return;

          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.cssText = `width:100%;display:block;margin-bottom:${p < pdfDoc.numPages ? "8px" : "0"};border-radius:4px;`;

          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
          if (cancelled) return;
          canvases.push(canvas);
        }

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = "";
          canvases.forEach(c => containerRef.current.appendChild(c));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Could not render PDF. Try downloading instead.");
          setLoading(false);
        }
      }
    };

    render();
    return () => {
      cancelled = true;
      if (currentContainer) currentContainer.innerHTML = "";
    };
  }, [dataUrl, scale]);

  if (error) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "rgba(255,255,255,.6)", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <div style={{ fontSize: 14 }}>{error}</div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Zoom + page count bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "10px 16px", background: "rgba(255,255,255,.05)", flexShrink: 0 }}>
        <button onClick={() => setScale(s => Math.max(s - .25, 0.5))} style={{ background: "rgba(255,255,255,.12)", border: "none", borderRadius: 8, width: 34, height: 34, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
        <span style={{ color: "rgba(255,255,255,.7)", fontSize: 13, minWidth: 52, textAlign: "center" }}>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(s + .25, 3))} style={{ background: "rgba(255,255,255,.12)", border: "none", borderRadius: 8, width: 34, height: 34, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        {numPages > 0 && <span style={{ color: "rgba(255,255,255,.4)", fontSize: 12, marginLeft: 4 }}>{numPages} page{numPages !== 1 ? "s" : ""}</span>}
      </div>

      {/* Spinner overlay while rendering */}
      {loading && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "rgba(255,255,255,.6)" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,.12)", borderTopColor: "var(--g)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          <div style={{ fontSize: 13 }}>Rendering PDF…</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Canvas container */}
      <div ref={containerRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", background: "#1a1a2e", display: loading ? "none" : "block" }} />
    </div>
  );
}

// ── Prescription Viewer (lightbox) ──────────────────────────────
