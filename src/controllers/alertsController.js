// Refactored Alerts Controller – uniform envelopes + accurate HTTP status codes

import * as alertsService from "../services/alertsService.js";
import * as aircraftService from "../services/aircraftService.js";
import { ok, fail, wrap } from "../utils/controllerUtils.js";

// =========================
//   Alerts (התרעות)
// =========================

// Get active alerts / קבלת התרעות פעילות
export const getActiveAlerts = wrap(async (_req, res) => {
  const alerts = alertsService.getActiveAlerts();
  ok(res, { alerts, count: alerts.length });
});

// Get all alerts / קבלת כל ההתרעות
export const getAllAlerts = wrap(async (_req, res) => {
  const alerts = alertsService.getAllAlerts();
  ok(res, { alerts, count: alerts.length });
});

// Get alerts by type / קבלת התרעות לפי סוג
export const getAlertsByType = wrap(async (req, res) => {
  const { type } = req.params;
  const alerts = alertsService.getAlertsByType(type);
  ok(res, { alerts, type, count: alerts.length });
});

// Get alerts by severity / קבלת התרעות לפי חומרה
export const getAlertsBySeverity = wrap(async (req, res) => {
  const { severity } = req.params;
  const alerts = alertsService.getAlertsBySeverity(severity);
  ok(res, { alerts, severity, count: alerts.length });
});

// Get alert statistics / קבלת סטטיסטיקות התרעות
export const getAlertsStats = wrap(async (_req, res) => {
  const stats = alertsService.getAlertsStats();
  ok(res, { stats });
});

// Analyze current aircraft data for alerts / ניתוח התרעות על נתוני מטוסים נוכחיים
export const analyzeCurrentAlerts = wrap(async (_req, res) => {
  const aircraftResult = await aircraftService.getAircraftData();
  if (!aircraftResult.success) {
    return fail(res, 502, "Failed to fetch aircraft data", { upstream: aircraftResult.error });
  }
  const analysisResult = await alertsService.analyzeAlerts(aircraftResult.aircraft);
  ok(res, {
    analysis: {
      newAlerts: analysisResult.newAlerts,
      totalNewAlerts: analysisResult.totalNewAlerts,
      aircraftAnalyzed: aircraftResult.count
    }
  });
});

// Test alert system health / בדיקת תקינות מערכת ההתרעות
export const testAlertSystem = wrap(async (_req, res) => {
  const test = alertsService.testAlertSystem();
  ok(res, { test });
});

// Save alerts to storage / שמירת התרעות לאחסון
export const saveAlerts = wrap(async (_req, res) => {
  const result = await alertsService.saveAlerts();
  if (!result?.success) return fail(res, 500, result?.error || "Save failed");
  ok(res, { result });
});

// Reload alerts from storage / טעינת התרעות מחדש מהאחסון
export const reloadAlerts = wrap(async (_req, res) => {
  const result = await alertsService.reloadAlerts();
  if (!result?.success) return fail(res, 500, result?.error || "Reload failed");
  ok(res, { result });
});

// Clear all alerts (with archiving) / ניקוי כל ההתרעות (כולל ארכוב)
export const clearAllAlerts = wrap(async (_req, res) => {
  const result = alertsService.clearAllAlerts();
  if (!result?.success) return fail(res, 500, result?.error || "Clear failed");
  ok(res, { result });
});

// Get filtered alerts / קבלת התרעות מסוננות
export const getFilteredAlerts = wrap(async (req, res) => {
  const { type, severity, active, since, includeHistorical = "false" } = req.query;
  const rawLimit = Number(req.query.limit ?? 100);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 1000) : 100;

  let sinceTime = null;
  if (since) {
    const t = new Date(String(since)).getTime();
    if (Number.isNaN(t)) return fail(res, 400, "Invalid 'since' date");
    sinceTime = t;
  }

  const includeHist = String(includeHistorical).toLowerCase() === "true";

  let alerts;
  if (includeHist) {
    const historyResult = await alertsService.getFullHistory();
    if (!historyResult?.success) return fail(res, 500, historyResult?.error || "Failed to load history");
    alerts = historyResult.alerts || [];
  } else {
    alerts = alertsService.getAllAlerts();
  }

  if (type) alerts = alerts.filter((a) => a.type === type);
  if (severity) alerts = alerts.filter((a) => a.severity === severity);
  if (active !== undefined) {
    const isActive = String(active).toLowerCase() === "true";
    alerts = alerts.filter((a) => a.active === isActive);
  }
  if (sinceTime !== null) alerts = alerts.filter((a) => a.timestamp >= sinceTime);

  alerts = alerts.slice(0, limit);

  ok(res, {
    alerts,
    filters: { type, severity, active: active ?? undefined, since: since ?? undefined, limit, includeHistorical: includeHist },
    count: alerts.length
  });
});

// Get full alerts history / קבלת היסטוריית התרעות מלאה
export const getFullHistory = wrap(async (_req, res) => {
  const result = await alertsService.getFullHistory();
  if (!result?.success) return fail(res, 500, result?.error || "Failed to load history");
  ok(res, result);
});

// Get alerts by date range / קבלת התרעות לפי טווח תאריכים
export const getAlertsByDateRange = wrap(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) return fail(res, 400, "Both 'startDate' and 'endDate' are required");

  const result = await alertsService.getAlertsByDateRange(startDate, endDate);
  if (!result?.success) return fail(res, 500, result?.error || "Failed to query date range");
  ok(res, result);
});

// Get available daily alert files / קבלת קבצי התרעות יומיים זמינים
export const getAvailableDailyFiles = wrap(async (_req, res) => {
  const result = await alertsService.getAvailableDailyFiles();
  if (!result?.success) return fail(res, 500, result?.error || "Failed to list daily files");
  ok(res, result);
});

// Get alerts for a specific date / קבלת התרעות מתאריך מסוים
export const getDailyAlerts = wrap(async (req, res) => {
  const { date } = req.params;
  if (!date) return fail(res, 400, "Date parameter is required (format: YYYY-MM-DD)");

  const result = await alertsService.getDailyAlerts(date);
  if (!result?.success) {
    const code = (result?.error || "").toLowerCase().includes("no data") ? 404 : 500;
    return fail(res, code, result?.error || "Failed to get daily alerts");
  }
  ok(res, result);
});
