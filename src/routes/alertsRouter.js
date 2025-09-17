// src/routes/alertsRouter.js
import { Router } from "express";
import {
  getActiveAlerts,
  getAllAlerts,
  getAlertsByType,
  getAlertsBySeverity,
  getAlertsStats,
  analyzeCurrentAlerts,
  testAlertSystem,
  clearAllAlerts,
  getFilteredAlerts,
  saveAlerts,
  reloadAlerts,
  getFullHistory,
  getAlertsByDateRange,
  getAvailableDailyFiles,
  getDailyAlerts
} from "../controllers/alertsController.js";

const router = Router();

// GET /api/alerts - קבלת התרעות עם פילטרים (ברירת מחדל: פעילות בלבד)
router.get("/", getFilteredAlerts);

// GET /api/alerts/active - קבלת התרעות פעילות בלבד
router.get("/active", getActiveAlerts);

// GET /api/alerts/all - קבלת כל ההתרעות (כולל היסטוריה)
router.get("/all", getAllAlerts);

// GET /api/alerts/stats - סטטיסטיקות התרעות
router.get("/stats", getAlertsStats);

// GET /api/alerts/analyze - הפעלת ניתוח התרעות על נתונים נוכחיים
router.get("/analyze", analyzeCurrentAlerts);

// GET /api/alerts/test - בדיקת מערכת ההתרעות
router.get("/test", testAlertSystem);

// GET /api/alerts/type/:type - קבלת התרעות לפי סוג
router.get("/type/:type", getAlertsByType);

// GET /api/alerts/severity/:severity - קבלת התרעות לפי חומרה
router.get("/severity/:severity", getAlertsBySeverity);

// היסטוריה וקבצים יומיים
// GET /api/alerts/history/full - קבלת היסטוריה מלאה של כל ההתרעות
router.get("/history/full", getFullHistory);

// GET /api/alerts/history/range - קבלת התרעות לפי טווח תאריכים
router.get("/history/range", getAlertsByDateRange);

// GET /api/alerts/history/daily - רשימת קבצים יומיים זמינים
router.get("/history/daily", getAvailableDailyFiles);

// GET /api/alerts/history/daily/:date - התרעות מיום ספציפי (YYYY-MM-DD)
router.get("/history/daily/:date", getDailyAlerts);

// פעולות ניהול
// POST /api/alerts/save - שמירה ידנית לקובץ
router.post("/save", saveAlerts);

// POST /api/alerts/reload - טעינה מחדש מהקובץ  
router.post("/reload", reloadAlerts);

// DELETE /api/alerts/clear - ניקוי כל ההתרעות ושמירה לקובץ
router.delete("/clear", clearAllAlerts);

export default router;