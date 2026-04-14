// ── Prescriptions API ─────────────────────────────────────────────
// All backend calls for the /prescriptions.php endpoint.
//
// NOTE: upload (POST) does NOT use apiFetch — it uses raw fetch() with
// FormData so the browser sets the correct multipart Content-Type with boundary.
// Do NOT change this to use apiFetch — it will break uploads.

import { apiFetch } from "../../services/api";
import { API_BASE } from "../../utils/constants";
import { getSession } from "../../services/storage";

/**
 * Fetch all prescriptions for a user (or patient).
 * Returns raw backend rows — caller uses mapRx() to convert.
 * @param {string} userId
 */
export const fetchPrescriptions = (userId) =>
  apiFetch(`/prescriptions.php?patient_id=${userId}`);

/**
 * Upload a prescription file via multipart FormData.
 * Raw fetch() — NOT apiFetch() — because FormData requires the browser
 * to set Content-Type: multipart/form-data with boundary automatically.
 *
 * @param {File} file
 * @param {string} title
 * @param {string|number} userId
 * @returns {Promise<object>} parsed JSON response
 */
export const uploadPrescription = async (file, title, userId) => {
  const sess = getSession();
  const token = sess?.token;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  if (userId) formData.append("patient_id", userId);

  // Token passed as query param — NOT as Authorization header
  const uploadUrl =
    API_BASE + "/prescriptions.php" + (token ? `?_token=${token}` : "");

  const res = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  return res.json(); // caller checks json.ok and json.data
};

/**
 * Delete a prescription by id.
 * @param {string} id
 */
export const deletePrescription = (id, userId) =>
  apiFetch(`/prescriptions.php?id=${id}${userId ? `&patient_id=${userId}` : ""}`, { method: "DELETE" });
