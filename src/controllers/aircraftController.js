// Refactored Aircraft Controller – clean structure, consistent error handling, bilingual docs

import * as aircraftService from "../services/aircraftService.js";
import { ok, wrap } from "../utils/controllerUtils.js";

// =========================
//   Aircraft (מטוסים)
// =========================

// Get live aircraft data from OpenSky / קבלת נתוני מטוסים חיים מ־OpenSky
export const getAircraft = wrap(async (req, res) => {
  const result = await aircraftService.getAircraftData();
  ok(res, { result });
});

// Test OpenSky connection / בדיקת חיבור ל־OpenSky
export const testOpenSky = wrap(async (req, res) => {
  const connection = await aircraftService.testConnection();
  ok(res, { connection });
});
