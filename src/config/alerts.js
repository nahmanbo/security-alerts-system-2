// src/config/alerts.js
export const ALERTS_CONFIG = {
    // זמן לשמירת התרעות בזיכרון (במילישניות)
    alertRetentionTime: 30 * 60 * 1000, // 30 דקות
    
    // זמן מינימלי בין התרעות דומות (למניעת ספאם)
    cooldownTime: 2 * 60 * 1000, // 2 דקות
    
    // רמות התרעה
    severity: {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM', 
      HIGH: 'HIGH',
      CRITICAL: 'CRITICAL'
    },
    
    // סוגי התרעות
    types: {
      SHARP_TURN: 'SHARP_TURN',           // פנייה חדה
      HOLDING_PATTERN: 'HOLDING_PATTERN', // תבנית המתנה
      NORTHWARD_DIVERSION: 'NORTHWARD_DIVERSION', // ניתוב צפונה
      APPROACH_ABORT: 'APPROACH_ABORT',   // ביטול גישה
      EMERGENCY_CODE: 'EMERGENCY_CODE',   // קוד חירום
      MULTIPLE_DIVERSIONS: 'MULTIPLE_DIVERSIONS', // מספר ניתובים
      TRAFFIC_STOP: 'TRAFFIC_STOP'        // עצירת תנועה
    },
    
    // קובץ לשמירת ההתרעות - מעודכן לתיקייה נפרדת
    storage: {
      alertsDirectory: './data/alerts/',
      currentAlertsFile: 'current_alerts.json',
      historicalAlertsFile: 'historical_alerts.json',
      dailyAlertsPattern: 'alerts_YYYY-MM-DD.json', // קבצים יומיים
      backupDirectory: './data/alerts/backups/',
      autoSave: true,
      saveInterval: 30 * 1000, // שמירה כל 30 שניות
      maxCurrentFileSize: 10 * 1024 * 1024, // 10MB לקובץ הנוכחי
      maxDailyFileSize: 50 * 1024 * 1024, // 50MB לקובץ יומי
      archiveAfterDays: 0, // 0 = לא למחוק אף פעם
      createDailyFiles: true, // יצירת קבצים יומיים
      keepFullHistory: true // שמירה על היסטוריה מלאה
    },
  
    // הגדרות זיהוי שינויים - רגישות גבוהה מאוד לתחילה
    detection: {
      // פנייה חדה - רגישות מקסימלית
      sharpTurn: {
        minAngleChange: 20, // הורדנו מ-45 ל-20 מעלות
        timeWindow: 90 * 1000, // הגדלנו ל-90 שניות
        enabled: true
      },
      
      // תבנית המתנה - רגישות גבוהה
      holdingPattern: {
        minCircularMovement: 180, // הורדנו מ-270 ל-180 מעלות (חצי מעגל)
        maxRadius: 8000, // הגדלנו מ-5000 ל-8000 מטר
        minDuration: 90 * 1000, // הורדנו מ-3 דקות ל-90 שניות
        maxSpeed: 300, // הגדלנו מ-200 ל-300 קשר
        enabled: true
      },
      
      // ניתוב צפונה - רגישות מקסימלית
      northwardDiversion: {
        northHeadingRange: {
          min: 300, // הרחבנו מ-315° ל-300°
          max: 60   // הרחבנו מ-45° ל-60°
        },
        minAngleChange: 15, // הורדנו מ-30 ל-15 מעלות
        enabled: true
      },
      
      // ביטול גישה - רגישות גבוהה
      approachAbort: {
        airportRadius: 25000, // הגדלנו מ-15 ל-25 ק"מ
        maxApproachAltitude: 5000, // הגדלנו מ-3000 ל-5000 רגל
        minDeviationAngle: 15, // הורדנו מ-30 ל-15 מעלות
        enabled: true  
      },
      
      // קודי חירום - כולל קודים נוספים
      emergencyCodes: {
        codes: [7700, 7600, 7500, 7400, 7777], // הוספנו קודים נוספים
        enabled: true
      },
      
      // מספר ניתובים - רגישות מקסימלית
      multipleDiversions: {
        minAircraft: 1, // הורדנו מ-2 ל-1 מטוס
        timeWindow: 3 * 60 * 1000, // הורדנו מ-5 ל-3 דקות
        enabled: true
      },
      
      // עצירת תנועה - רגישות גבוהה
      trafficStop: {
        minReduction: 40, // הורדנו מ-70% ל-40%
        timeWindow: 3 * 60 * 1000, // הורדנו ל-3 דקות
        enabled: true
      },
      
      // שינוי מהירות פתאומי (חדש)
      suddenSpeedChange: {
        minSpeedChangePct: 30, // שינוי של 30% במהירות
        timeWindow: 60 * 1000,
        enabled: true
      },
      
      // שינוי גובה פתאומי (חדש) 
      suddenAltitudeChange: {
        minAltitudeChangeFt: 500, // שינוי של 500 רגל
        timeWindow: 60 * 1000,
        enabled: true
      }
    },
    
    // הגדרות להתרעות מצטברות
    composite: {
      // התרעה ביטחונית כללית
      securityAlert: {
        minEvents: 2, // מספר אירועים מינימלי
        timeWindow: 10 * 60 * 1000, // 10 דקות
        severity: 'HIGH'
      }
    }
  };