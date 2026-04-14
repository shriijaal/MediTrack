// ── Pure formatting helpers ───────────────────────────────────────
// No side effects. No imports needed. Safe to use anywhere.

/**
 * Returns expiry status for a medicine.
 * @param {string} e - expiry date string (YYYY-MM-DD) or empty
 * @returns {"expired"|"expiring"|null}
 */
export const expSt = e => {
  if (!e) return null;
  const d = (new Date(e) - new Date()) / 86400000;
  return d < 0 ? "expired" : d < 30 ? "expiring" : null;
};

/**
 * Formats a file size in bytes to a human-readable string.
 * @param {number} b - bytes
 * @returns {string} e.g. "596 KB" or "1.2 MB"
 */
export const fmtSz = b =>
  b < 1048576
    ? `${(b / 1024).toFixed(0)} KB`
    : `${(b / 1048576).toFixed(1)} MB`;

/**
 * Converts stored 24h "HH:MM" time to "H:MM AM/PM" display format.
 * @param {string} t24 - time string like "08:00" or "14:30"
 * @returns {string} e.g. "8:00 AM" or "2:30 PM"
 */
export const fmt12 = t24 => {
  if (!t24) return t24;
  const [hStr, mStr] = (t24 + ":00").split(":");
  const hh = parseInt(hStr, 10);
  return `${hh % 12 || 12}:${mStr} ${hh < 12 ? "AM" : "PM"}`;
};
