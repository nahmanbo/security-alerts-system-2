// Refactored Monitor Controller – uniform envelopes + accurate HTTP status codes

import * as monitoringService from "../services/monitoringService.js";
import { ok, fail, wrap } from "../utils/controllerUtils.js";

// =========================
//   Monitor (ניטור)
// =========================

// Start automatic monitoring / התחלת ניטור אוטומטי
export const startMonitoring = wrap(async (req, res) => {
  const config = (req.body && typeof req.body === "object") ? req.body : {};
  const result = monitoringService.startMonitoring(config);
  if (result?.success === false) return fail(res, 409, result.message || "Monitoring already running");
  ok(res, { result });
});

// Stop automatic monitoring / עצירת ניטור אוטומטי
export const stopMonitoring = wrap(async (_req, res) => {
  const result = monitoringService.stopMonitoring();
  if (result?.success === false) return fail(res, 409, result.message || "Monitoring is not running");
  ok(res, { result });
});

// Get monitoring status / קבלת סטטוס ניטור
export const getMonitoringStatus = wrap(async (_req, res) => {
  const status = monitoringService.getMonitoringStatus();
  ok(res, { status });
});

// Update monitoring configuration / עדכון הגדרות ניטור
export const updateMonitoringConfig = wrap(async (req, res) => {
  const config = (req.body && typeof req.body === "object") ? req.body : {};
  const result = monitoringService.updateMonitoringConfig(config);
  ok(res, { result });
});

// Run manual monitoring analysis / הרצת ניתוח ידני
export const runManualAnalysis = wrap(async (_req, res) => {
  const result = await monitoringService.runManualAnalysis();
  if (!result?.success) return fail(res, 500, result?.error || "Manual analysis failed");
  ok(res, { result });
});
