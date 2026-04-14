// ── App-wide constants ────────────────────────────────────────────
// Change API_BASE to your XAMPP path when backend is connected
export const API_BASE = "http://localhost/meditrack-backend/api";

export const FREQ = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
  "Weekly",
];

export const UNITS = [
  "mg",
  "ml",
  "tablet(s)",
  "capsule(s)",
  "drops",
  "puff(s)",
  "patch(es)",
];

// Generates a short random local ID (used before a real DB id is returned)
export const uid = () => Math.random().toString(36).slice(2, 9);

// Returns today's date as YYYY-MM-DD string
export const today = () => new Date().toISOString().split("T")[0];
