import { useState, useRef } from "react";
import { Icons } from "../../components/icons/Icons";
import { SvgI } from "../../components/icons/Icons";
import { fmtSz } from "../../utils/formatters";
import { PdfViewer } from "./PdfHelpers";

export function RxViewer({ rx, onClose, onDownload }) {
  const isImg = rx.type?.includes("image");
  const isPdf = rx.type?.includes("pdf");
  // Use data URL (base64) if available, otherwise direct backend URL
  const src = rx.data || rx.url;
  // For backend files (url only, no data), use direct URL approach
  const isBackendFile = !rx.data && rx.url;

  // Image zoom/pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);

  const zoomIn = () => setZoom(z => Math.min(z + 0.5, 4));
  const zoomOut = () => { setZoom(z => { const nz = Math.max(z - 0.5, 1); if (nz === 1) setPan({ x: 0, y: 0 }); return nz; }); };
  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const onMouseDown = e => { if (zoom <= 1) return; setDragging(true); dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; };
  const onMouseMove = e => { if (!dragging || !dragStart.current) return; setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const onMouseUp = () => setDragging(false);

  return (
    <div className="vwr-overlay" onClick={e => e.target.classList.contains("vwr-overlay") && onClose()}>
      <div className="vwr-box">
        {/* Header */}
        <div className="vwr-hd">
          <div className="vwr-hd-info">
            <div className="vwr-hd-name">{rx.name}</div>
            <div className="vwr-hd-meta">{fmtSz(rx.size)} · {rx.uploadedAt}</div>
          </div>
          <div className="vwr-hd-acts">
            <button className="vwr-btn" onClick={onDownload} title="Download">
              <SvgI d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </button>
            <button className="vwr-btn vwr-close" onClick={onClose} title="Close">
              <Icons.close />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="vwr-body">
          {isImg && (
            <>
              <div className="vwr-img-wrap"
                style={{ cursor: zoom > 1 ? "grab" : "default" }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}>
                <img
                  src={src}
                  alt={rx.name}
                  className="vwr-img"
                  style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px,${pan.y / zoom}px)`, cursor: dragging ? "grabbing" : zoom > 1 ? "grab" : "default" }}
                  draggable={false}
                  onError={e => { e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "flex"); }}
                />
                {/* Fallback if image fails to load */}
                <div style={{ display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,.5)", gap: 12 }}>
                  <SvgI d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" s={48} />
                  <div style={{ fontSize: 13 }}>Image could not be loaded</div>
                  <a href={src} target="_blank" rel="noreferrer" style={{ color: "var(--g)", fontSize: 13, fontWeight: 600 }}>Open in new tab →</a>
                </div>
              </div>
              <div className="vwr-zoom-bar">
                <button className="vwr-zoom-btn" onClick={zoomOut} disabled={zoom <= 1}><SvgI d="M5 12h14" /></button>
                <span className="vwr-zoom-val" onClick={reset}>{Math.round(zoom * 100)}%</span>
                <button className="vwr-zoom-btn" onClick={zoomIn} disabled={zoom >= 4}><SvgI d="M12 5v14M5 12h14" /></button>
              </div>
            </>
          )}

          {isPdf && (
            isBackendFile
              ? /* For backend PDFs, show in an iframe directly */
              <iframe
                src={src}
                style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
                title={rx.name}
              />
              : <PdfViewer dataUrl={src} />
          )}

          {!isImg && !isPdf && (
            <div className="vwr-unsupported">
              <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{rx.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 24 }}>This file type can't be previewed in-app.</div>
              <button className="btn btn-p" style={{ width: "auto", padding: "11px 28px" }} onClick={onDownload}>
                <SvgI d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /> Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
