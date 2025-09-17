// src/controllers/alertsController.js
import * as alertsService from "../services/alertsService.js";
import * as aircraftService from "../services/aircraftService.js";

// קבלת התרעות פעילות
export async function getActiveAlerts(req, res) {
  try {
    const alerts = alertsService.getActiveAlerts();
    res.json({
      success: true,
      alerts,
      count: alerts.length,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// קבלת כל ההתרעות (כולל היסטוריה)
export async function getAllAlerts(req, res) {
  try {
    const alerts = alertsService.getAllAlerts();
    res.json({
      success: true,
      alerts,
      count: alerts.length,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// קבלת התרעות לפי סוג
export async function getAlertsByType(req, res) {
  try {
    const { type } = req.params;
    const alerts = alertsService.getAlertsByType(type);
    
    res.json({
      success: true,
      alerts,
      type,
      count: alerts.length,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// קבלת התרעות לפי חומרה
export async function getAlertsBySeverity(req, res) {
  try {
    const { severity } = req.params;
    const alerts = alertsService.getAlertsBySeverity(severity);
    
    res.json({
      success: true,
      alerts,
      severity,
      count: alerts.length,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// קבלת סטטיסטיקות התרעות
export async function getAlertsStats(req, res) {
  try {
    const stats = alertsService.getAlertsStats();
    res.json({
      success: true,
      stats,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// הפעלת ניתוח התרעות על נתונים נוכחיים
export async function analyzeCurrentAlerts(req, res) {
  try {
    // קבלת נתוני מטוסים נוכחיים
    const aircraftResult = await aircraftService.getAircraftData();
    
    if (!aircraftResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch aircraft data',
        aircraftError: aircraftResult.error,
        timestamp: Date.now()
      });
    }
    
    // ניתוח התרעות
    const analysisResult = await alertsService.analyzeAlerts(aircraftResult.aircraft);
    
    res.json({
      success: true,
      analysis: {
        newAlerts: analysisResult.newAlerts,
        totalNewAlerts: analysisResult.totalNewAlerts,
        aircraftAnalyzed: aircraftResult.count
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// בדיקת מערכת ההתרעות
export async function testAlertSystem(req, res) {
  try {
    const testResult = alertsService.testAlertSystem();
    res.json({
      success: true,
      test: testResult,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// שמירה ידנית של ההתרעות
export async function saveAlerts(req, res) {
  try {
    const result = await alertsService.saveAlerts();
    res.json({
      success: result.success,
      result,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// קבלת התרעות עם פילטרים
export async function getFilteredAlerts(req, res) {
  try {
    const {
      type,
      severity,
      active,
      since,
      limit = 100,
      includeHistorical = false
    } = req.query;
    
    // קבלת התרעות (עם או בלי היסטוריה)
    let alerts;
    if (includeHistorical === 'true') {
      const historyResult = await alertsService.getFullHistory();
      alerts = historyResult.alerts || [];
    } else {
      alerts = alertsService.getAllAlerts();
    }
    
    // פילטר לפי סוג
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    // פילטר לפי חומרה
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    // פילטר לפי סטטוס פעיל
    if (active !== undefined) {
      const isActive = active === 'true';
      alerts = alerts.filter(alert => alert.active === isActive);
    }
    
    // פילטר לפי זמן
    if (since) {
      const sinceTime = new Date(since).getTime();
      alerts = alerts.filter(alert => alert.timestamp >= sinceTime);
    }
    
    // הגבלת מספר התוצאות
    alerts = alerts.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      alerts,
      filters: { type, severity, active, since, limit, includeHistorical },
      count: alerts.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// טעינה מחדש מהקובץ
export async function reloadAlerts(req, res) {
  try {
    const result = await alertsService.reloadAlerts();
    res.json({
      success: result.success,
      result,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// ניקוי כל ההתרעות - מעודכן עם שמירה לקובץ
export async function clearAllAlerts(req, res) {
  try {
    const result = alertsService.clearAllAlerts();
    res.json({
      success: result.success,
      result,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// קבלת היסטוריית התרעות מלאה
export async function getFullHistory(req, res) {
  try {
    const result = await alertsService.getFullHistory();
    res.json({
      success: result.success,
      alerts: result.alerts,
      totalCount: result.totalCount,
      historicalCount: result.historicalCount,
      currentCount: result.currentCount,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// קבלת התרעות לפי טווח תאריכים
export async function getAlertsByDateRange(req, res) {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Both startDate and endDate are required',
        timestamp: Date.now()
      });
    }
    
    const result = await alertsService.getAlertsByDateRange(startDate, endDate);
    res.json({
      success: result.success,
      alerts: result.alerts,
      count: result.count,
      dateRange: result.dateRange,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// קבלת קבצים יומיים זמינים
export async function getAvailableDailyFiles(req, res) {
  try {
    const result = await alertsService.getAvailableDailyFiles();
    res.json({
      success: result.success,
      files: result.files,
      count: result.count,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// קבלת התרעות מיום ספציפי
export async function getDailyAlerts(req, res) {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required (format: YYYY-MM-DD)',
        timestamp: Date.now()
      });
    }
    
    const result = await alertsService.getDailyAlerts(date);
    res.json({
      success: result.success,
      date: result.date,
      alerts: result.alerts,
      count: result.count,
      metadata: result.metadata,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}