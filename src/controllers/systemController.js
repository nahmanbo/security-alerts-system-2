// src/controllers/systemController.js
import * as systemService from "../services/systemService.js";
import { ok, fail, wrap } from "../utils/controllerUtils.js";

// =========================
//   System (מערכת)
// =========================

// Get system health status / קבלת סטטוס בריאות המערכת
export const getHealth = wrap(async (req, res) => {
  const health = systemService.getSystemHealth();
  ok(res, { health });
});

// Get system information / קבלת מידע על המערכת
export const getInfo = wrap(async (req, res) => {
  const info = systemService.getSystemInfo();
  ok(res, { info });
});
