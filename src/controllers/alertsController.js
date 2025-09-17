// Refactored Alerts Controller – clean structure, consistent error handling, bilingual docs

import * as alertsService from "../services/alertsService.js";
import * as aircraftService from "../services/aircraftService.js";
import * as monitoringService from "../services/monitoringService.js";
import { ok, fail, wrap } from "../utils/controllerUtils.js";

// =========================
//   Monitoring (ניטור)
// =========================

// Start automatic monitoring / התחלת ניטור אוטומטי
export const startMonitoring = wrap(async (req, res) => {
  const config = req.body && typeof req.body === "object" ? req.body : {};
  const result = monitoringService.startMonitoring(config);
  ok(res, { result });
});

// Stop automatic monitoring / עצירת ניטור אוטומטי
export const stopMonitoring = wrap(async (req, res) => {
  const result = monitoringService.stopMonitoring();
  ok(res, { result });
});

// Get monitoring status / קבלת סטטוס ניטור
export const getMonitoringStatus = wrap(async (req, res) => {
  const status = monitoringService.getMonitoringStatus();
  ok(res, { status });
});

// Update monitoring configuration / עדכון הגדרות ניטור
export const updateMonitoringConfig = wrap(async (req, res) => {
  const config = req.body && typeof req.body === "object" ? req.body : {};
  const result = monitoringService.updateMonitoringConfig(config);
  ok(res, { result });
});

// Run manual monitoring analysis / הרצת ניתוח ידני
export const runManualAnalysis = wrap(async (req, res) => {
  const result = await monitoringService.runManualAnalysis();
  ok(res, { result });
});

// =========================
//   Alerts (התרעות)
// =========================

// Get active alerts / קבלת התרעות פעילות
export const getActiveAlerts = wrap(async (req, res) => {
  const alerts = alertsService.getActiveAlerts();
  ok(res, { alerts, count: alerts.length });
});

// Get all alerts / קבלת כל ההתרעות
export const getAllAlerts = wrap(async (req, res) => {
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
export const getAlertsStats = wrap(async (req, res) => {
  const stats = alertsService.getAlertsStats();
  ok(res, { stats });
});

// Analyze current aircraft data for alerts / ניתוח התרעות על נתוני מטוסים נוכחיים
export const analyzeCurrentAlerts = wrap(async (req, res) => {
  const aircraftResult = await aircraftService.getAircraftData();
  if (!aircraftResult.success) {
    return fail(res, 500, "Failed to fetch aircraft data", {
      aircraftError: aircraftResult.error,
    });
  }
  const analysisResult = await alertsService.analyzeAlerts(aircraftResult.aircraft);
  ok(res, {
    analysis: {
      newAlerts: analysisResult.newAlerts,
      totalNewAlerts: analysisResult.totalNewAlerts,
      aircraftAnalyzed: aircraftResult.count,
    },
  });
});

// Test alert system health / בדיקת תקינות מערכת ההתרעות
export const testAlertSystem = wrap(async (req, res) => {
  const test = alertsService.testAlertSystem();
  ok(res, { test });
});

// Save alerts to storage / שמירת התרעות לאחסון
export const saveAlerts = wrap(async (req, res) => {
  const result = await alertsService.saveAlerts();
  ok(res, { result });
});

// Reload alerts from storage / טעינת התרעות מחדש מהאחסון
export const reloadAlerts = wrap(async (req, res) => {
  const result = await alertsService.reloadAlerts();
  ok(res, { result });
});

// Clear all alerts (with archiving) / ניקוי כל ההתרעות (כולל שמירה בארכיון)
export const clearAllAlerts = wrap(async (req, res) => {
  const result = alertsService.clearAllAlerts();
  ok(res, { result });
});

// Get filtered alerts / קבלת התרעות מסוננות
export const getFilteredAlerts = wrap(async (req, res) => {
  const {
    type,
    severity,
    active,
    since,
    limit = 100,
    includeHistorical = false,
  } = req.query;

  let alerts;
  if (includeHistorical === "true") {
    const historyResult = await alertsService.getFullHistory();
    alerts = historyResult.alerts || [];
  } else {
    alerts = alertsService.getAllAlerts();
  }

  if (type) alerts = alerts.filter((a) => a.type === type);
  if (severity) alerts = alerts.filter((a) => a.severity === severity);
  if (active !== undefined) {
    const isActive = active === "true";
    alerts = alerts.filter((a) => a.active === isActive);
  }
  if (since) {
    const sinceTime = new Date(since).getTime();
    if (!isNaN(sinceTime)) alerts = alerts.filter((a) => a.timestamp >= sinceTime);
  }

  alerts = alerts.slice(0, parseInt(String(limit), 10));
  ok(res, {
    alerts,
    filters: { type, severity, active, since, limit, includeHistorical },
    count: alerts.length,
  });
});

// Get full alerts history / קבלת היסטוריית התרעות מלאה
export const getFullHistory = wrap(async (req, res) => {
  const result = await alertsService.getFullHistory();
  ok(res, result);
});

// Get alerts by date range / קבלת התרעות לפי טווח תאריכים
export const getAlertsByDateRange = wrap(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return fail(res, 400, "Both startDate and endDate are required");
  }
  const result = await alertsService.getAlertsByDateRange(startDate, endDate);
  ok(res, result);
});

// Get available daily alert files / קבלת קבצי התרעות יומיים זמינים
export const getAvailableDailyFiles = wrap(async (req, res) => {
  const result = await alertsService.getAvailableDailyFiles();
  ok(res, result);
});

// Get alerts for a specific date / קבלת התרעות מתאריך מסוים
export const getDailyAlerts = wrap(async (req, res) => {
  const { date } = req.params;
  if (!date) {
    return fail(res, 400, "Date parameter is required (format: YYYY-MM-DD)");
  }
  const result = await alertsService.getDailyAlerts(date);
  ok(res, result);
});
