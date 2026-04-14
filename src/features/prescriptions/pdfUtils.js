/**
 * PDF.js loader and utilities to avoid React Fast Refresh issues
 */

// ── PDF.js loader (singleton) ────────────────────────────────────
let pdfJsLoading = null;
export async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (pdfJsLoading) return pdfJsLoading;

  pdfJsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });

  return pdfJsLoading;
}

// Decode base64 data URL to Uint8Array
export function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Returns a pdf.js document source — works for both base64 dataUrls and http:// URLs
export function getPdfSource(dataUrl) {
  if (!dataUrl) return null;
  if (dataUrl.startsWith("data:")) return { data: dataUrlToBytes(dataUrl) };
  if (dataUrl.startsWith("http")) return { url: dataUrl };
  return { data: dataUrlToBytes(dataUrl) };
}
