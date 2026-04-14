// ── API client ────────────────────────────────────────────────────
// Wraps all backend requests with:
//   - token appended as ?_token= query param (NOT Authorization header —
//     Apache strips auth headers before PHP receives them)
//   - Content-Type: text/plain only when body exists and is not FormData
//     (avoids CORS preflight for simple requests)
//   - JSON response unwrapping: returns json.data or throws json.error
//
// IMPORTANT: prescription upload does NOT use apiFetch — it uses raw fetch()
// with FormData so the browser sets multipart Content-Type with boundary.
// Do not change that. See RxSlide.confirmUpload().

import { API_BASE } from "../utils/constants";
import { getSession, clearSess } from "./storage";

export const apiFetch = async (path, opts = {}) => {
  const sess = getSession();
  const token = sess?.token;
  const isFormData = opts.body instanceof FormData;
  const hasBody = opts.body !== undefined && opts.body !== null;

  // Append token as query param — avoids Authorization header which:
  // 1. Triggers CORS preflight (extra OPTIONS request)
  // 2. Gets stripped by Apache before reaching PHP
  const sep = path.includes("?") ? "&" : "?";
  const url = API_BASE + path + (token ? `${sep}_token=${token}` : "");

  const headers = {
    // Only set Content-Type when there is a body and it's not FormData.
    // text/plain avoids CORS preflight; GET/DELETE have no body so no header needed.
    ...(hasBody && !isFormData ? { "Content-Type": "text/plain" } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(url, { ...opts, headers });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(
      `Server error (HTTP ${res.status}). Check XAMPP Apache is running.`
    );
  }

  if (res.status === 401) {
    clearSess();
    window.location.reload();
    return;
  }

  if (!json.ok) throw new Error(json.error || "Request failed");
  return json.data;
};
