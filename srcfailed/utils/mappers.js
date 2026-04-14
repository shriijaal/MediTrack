// ── Backend response mappers ──────────────────────────────────────
// These functions convert raw PHP API response shapes into the
// frontend internal shape. They appear in MedsSlide, MedsTab,
// Dashboard, SearchPage, and ProfileTab — centralised here to avoid drift.
//
// IMPORTANT: backend field names (expiry_date, added_by_name, file_name etc.)
// must NOT be renamed here — they come directly from the PHP/MySQL layer.

/**
 * Maps a raw medicine row from the backend into the frontend medicine shape.
 * Used in: MedsSlide, MedsTab, Dashboard, SearchPage, ExpirySlide
 *
 * Backend fields: id, name, dosage, unit, frequency, times, quantity,
 *                 expiry_date, notes, added_by_name, updated_by_name
 */
export const mapMed = m => ({
  id:              String(m.id),
  name:            m.name,
  dosage:          m.dosage,
  unit:            m.unit,
  frequency:       m.frequency,
  times:           m.times || [],
  quantity:        m.quantity,
  expiry:          m.expiry_date || "",
  notes:           m.notes || "",
  addedByName:     m.added_by_name,
  updatedByName:   m.updated_by_name,
});

/**
 * Maps a raw prescription row from the backend into the frontend rx shape.
 * Used in: RxSlide, SearchPage, ProfileTab
 *
 * Backend fields: id, title, file_name, mime_type, file_size,
 *                 uploaded_at, url, data (base64)
 */
export const mapRx = r => ({
  id:         String(r.id),
  title:      r.title || r.file_name,
  name:       r.file_name,
  type:       r.mime_type,
  size:       r.file_size,
  uploadedAt: r.uploaded_at,
  url:        r.url,
  data:       r.data || null, // base64 data URL embedded by backend
});
