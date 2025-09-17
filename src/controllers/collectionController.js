// Refactored Collection Controller – clean structure, consistent error handling, bilingual docs

import * as collectionService from "../services/dataCollectionService.js";
import { ok, fail, wrap } from "../utils/controllerUtils.js";

// =========================
//   Collection (איסוף נתונים)
// =========================

// Get collection status and statistics / קבלת סטטוס וסטטיסטיקות איסוף נתונים
export const getCollectionStatus = wrap(async (req, res) => {
  const collection = collectionService.getCollectionStats();
  ok(res, { collection });
});

// Start automatic data collection / התחלת איסוף נתונים אוטומטי
export const startDataCollection = wrap(async (req, res) => {
  const result = collectionService.startCollection();
  if (!result.success) return fail(res, 400, result.message || "Failed to start collection");
  ok(res, { result });
});

// Stop automatic data collection / עצירת איסוף נתונים אוטומטי
export const stopDataCollection = wrap(async (req, res) => {
  const result = collectionService.stopCollection();
  if (!result.success) return fail(res, 400, result.message || "Failed to stop collection");
  ok(res, { result });
});

// Trigger manual collection / הפעלת איסוף נתונים ידני
export const manualCollect = wrap(async (req, res) => {
  const result = await collectionService.triggerCollection();
  if (!result.success) return fail(res, 500, result.message || "Manual collection failed");
  ok(res, { result });
});
