import { Router } from "express";
import {
  getActiveAlerts,
  getAllAlerts,
  getAlertsByType,
  getAlertsBySeverity,
  getAlertsStats,
  analyzeCurrentAlerts,
  testAlertSystem,
  saveAlerts,
  reloadAlerts,
  clearAllAlerts,
  getFilteredAlerts,
  getFullHistory,
  getAlertsByDateRange,
  getAvailableDailyFiles,
  getDailyAlerts
} from "../controllers/alertsController.js";

const router = Router();

// =========================
//   Alerts (התרעות)
// =========================

// Get active alerts / קבלת התרעות פעילות
router.get("/active", getActiveAlerts);

// Get all alerts / קבלת כל ההתרעות
router.get("/", getAllAlerts);

// Get alerts by type / קבלת התרעות לפי סוג
router.get("/type/:type", getAlertsByType);

// Get alerts by severity / קבלת התרעות לפי חומרה
router.get("/severity/:severity", getAlertsBySeverity);

// Get alert statistics / קבלת סטטיסטיקות התרעות
router.get("/stats", getAlertsStats);

// Analyze current aircraft data for alerts / ניתוח התרעות על נתוני מטוסים נוכחיים
router.post("/analyze", analyzeCurrentAlerts);

// Test alert system / בדיקת מערכת ההתרעות
router.get("/test", testAlertSystem);

// Save alerts / שמירת התרעות
router.post("/save", saveAlerts);

// Reload alerts / טעינת התרעות מחדש
router.post("/reload", reloadAlerts);

// Clear all alerts (archive) / ניקוי כל ההתרעות (כולל ארכוב)
router.post("/clear", clearAllAlerts);

// Get filtered alerts / קבלת התרעות מסוננות
router.get("/filtered", getFilteredAlerts);

// Get full alerts history / קבלת היסטוריית התרעות מלאה
router.get("/history", getFullHistory);

// Get alerts by date range / קבלת התרעות לפי טווח תאריכים
router.get("/history/range", getAlertsByDateRange);

// List daily alert files / קבלת רשימת קבצים יומיים
router.get("/daily/files", getAvailableDailyFiles);

// Get alerts for a specific date / קבלת התרעות מתאריך מסוים
router.get("/daily/:date", getDailyAlerts);

export default router;
