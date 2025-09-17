// Refactored System Controller – uniform envelopes + accurate HTTP status codes

import * as systemService from "../services/systemService.js";
import { ok, wrap } from "../utils/controllerUtils.js";

// =========================
//   System (מערכת)
// =========================

// Get system health status / קבלת סטטוס בריאות המערכת
export const getHealth = wrap(async (_req, res) => {
  const health = systemService.getSystemHealth();
  ok(res, { health });
});

// Get system information / קבלת מידע על המערכת
export const getInfo = wrap(async (_req, res) => {
  const info = systemService.getSystemInfo();
  ok(res, { info });
});
