// ── Medicines API ─────────────────────────────────────────────────
// All backend calls for the /medicines.php endpoint.
// Methods, query params, and body shapes must stay exactly as-is —
// they match the PHP backend exactly.

import { apiFetch } from "../../services/api";

/**
 * Fetch all medicines for a user (or patient if caretaker).
 * @param {string|null} patientId - set if caretaker is viewing a patient
 */
export const fetchMedicines = (patientId = null) => {
  const qs = patientId ? `?patient_id=${patientId}` : "";
  return apiFetch(`/medicines.php${qs}`);
};

/**
 * Save (add or edit) a medicine.
 * @param {"POST"|"PUT"} method
 * @param {object} body - medicine fields
 * @param {string|null} medId - required for PUT
 * @param {string|null} patientId - set if caretaker
 */
export const saveMedicine = (method, body, medId = null, patientId = null) => {
  let qs = "";
  if (medId) {
    qs = `?id=${medId}${patientId ? `&patient_id=${patientId}` : ""}`;
  } else if (patientId) {
    qs = `?patient_id=${patientId}`;
  }
  const payload = patientId ? { ...body, patient_id: patientId } : body;
  return apiFetch(`/medicines.php${qs}`, {
    method,
    body: JSON.stringify(payload),
  });
};

/**
 * Delete a medicine by id.
 * @param {string} medId
 * @param {string|null} patientId - set if caretaker
 */
export const deleteMedicine = (medId, patientId = null) => {
  const qs = `?id=${medId}${patientId ? `&patient_id=${patientId}` : ""}`;
  return apiFetch(`/medicines.php${qs}`, { method: "DELETE" });
};
