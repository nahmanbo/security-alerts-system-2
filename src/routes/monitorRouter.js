import { Router } from "express";
import {
    startMonitoring,
    stopMonitoring,
    getMonitoringStatus,
    updateMonitoringConfig,
    runManualAnalysis
  } from "../controllers/monitorController.js";

const router = Router();

// =========================
//   Monitor (ניטור)
// =========================

// Start automatic monitoring / התחלת ניטור אוטומטי
router.post("/start", startMonitoring);

// Stop automatic monitoring / עצירת ניטור אוטומטי
router.post("/stop", stopMonitoring);

// Get monitoring status / קבלת סטטוס ניטור
router.get("/status", getMonitoringStatus);

// Update monitoring configuration / עדכון הגדרות ניטור
router.patch("/config", updateMonitoringConfig);

// Run manual monitoring analysis / הרצת ניתוח ידני
router.post("/manual", runManualAnalysis);

export default router;
