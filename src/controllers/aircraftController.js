// Refactored Aircraft Controller – uniform envelopes + accurate HTTP status codes

import * as aircraftService from "../services/aircraftService.js";
import { ok, fail, wrap } from "../utils/controllerUtils.js";

// =========================
//   Aircraft (מטוסים)
// =========================

// Get live aircraft data from OpenSky / קבלת נתוני מטוסים חיים מ־OpenSky
export const getAircraft = wrap(async (_req, res) => {
  const r = await aircraftService.getAircraftData();
  if (!r.success) return fail(res, 502, r.error || "OpenSky upstream error");
  ok(res, { aircraft: r.aircraft, count: r.count, metadata: r.metadata });
});

// Test OpenSky connection / בדיקת חיבור ל־OpenSky
export const testOpenSky = wrap(async (_req, res) => {
  const r = await aircraftService.testConnection();
  if (!r.success) return fail(res, 502, r.message || "OpenSky connection failed", { authEnabled: r.authEnabled });
  ok(res, { connection: r });
});
