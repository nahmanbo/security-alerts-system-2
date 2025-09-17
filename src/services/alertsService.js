// src/services/alertsService.js - Clean & Optimized Version
import { ALERTS_CONFIG } from "../config/alerts.js";
import { AIRPORT_CONFIG } from "../config/airport.js";
import fs from 'fs/promises';
import path from 'path';

// ================================
// State Management
// ================================
let alertsCache = [];
let aircraftHistory = new Map();
let lastAlerts = new Map();
let autoSaveTimer = null;

// ================================
// File Path Utilities
// ================================
const paths = {
  current: () => path.join(ALERTS_CONFIG.storage.alertsDirectory, ALERTS_CONFIG.storage.currentAlertsFile),
  historical: () => path.join(ALERTS_CONFIG.storage.alertsDirectory, ALERTS_CONFIG.storage.historicalAlertsFile),
  daily: (date = new Date()) => {
    const dateStr = date.toISOString().split('T')[0];
    const fileName = ALERTS_CONFIG.storage.dailyAlertsPattern.replace('YYYY-MM-DD', dateStr);
    return path.join(ALERTS_CONFIG.storage.alertsDirectory, fileName);
  },
  backup: (fileName) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(ALERTS_CONFIG.storage.backupDirectory, `${timestamp}_${fileName}`);
  }
};

// ================================
// File System Operations
// ================================
class FileManager {
  static async ensureDirectories() {
    const dirs = [ALERTS_CONFIG.storage.alertsDirectory, ALERTS_CONFIG.storage.backupDirectory];
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Created: ${dir}`);
      }
    }
  }

  static async loadJSON(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      
      // Check if file is empty or contains only whitespace
      if (!data.trim()) {
        console.log(`📄 Empty file: ${filePath}`);
        return null;
      }
      
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`📄 File not found: ${filePath}`);
        return null;
      }
      
      if (error instanceof SyntaxError) {
        console.error(`📄 Invalid JSON in: ${filePath}`);
        console.error(`Error: ${error.message}`);
        
        // Create backup of corrupted file
        const backupPath = `${filePath}.corrupted.${Date.now()}`;
        try {
          await fs.copyFile(filePath, backupPath);
          console.log(`📦 Corrupted file backed up to: ${backupPath}`);
        } catch (backupError) {
          console.error(`Failed to backup corrupted file: ${backupError.message}`);
        }
        
        return null;
      }
      
      throw error;
    }
  }

  static async saveJSON(filePath, data) {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonString);
    return jsonString.length;
  }

  static async safeSave(filePath, data, maxSize) {
    const size = await this.saveJSON(filePath, data);
    
    if (size > maxSize) {
      const backupPath = paths.backup(path.basename(filePath));
      await fs.copyFile(filePath, backupPath);
      console.log(`📦 Backup created: ${backupPath}`);
    }
    
    return size;
  }
}

// ================================
// Math Utilities
// ================================
const MathUtils = {
  angleDifference: (angle1, angle2) => {
    const diff = Math.abs(angle1 - angle2);
    return Math.min(diff, 360 - diff);
  },

  distance: (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  isNorthward: (heading) => {
    const { min, max } = ALERTS_CONFIG.detection.northwardDiversion.northHeadingRange;
    return heading >= min || heading <= max;
  }
};

// ================================
// Alert Management
// ================================
class AlertManager {
  static canSendAlert(type, icao24 = null) {
    const key = `${type}_${icao24 || 'global'}`;
    const lastTime = lastAlerts.get(key);
    return !lastTime || (Date.now() - lastTime) > ALERTS_CONFIG.cooldownTime;
  }

  static createAlert(type, severity, aircraft, details) {
    const alert = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      timestamp: Date.now(),
      aircraft: aircraft ? {
        icao24: aircraft.icao24,
        callsign: aircraft.callsign,
        position: aircraft.position,
        movement: aircraft.movement
      } : null,
      details,
      active: true
    };

    alertsCache.push(alert);
    
    const key = `${type}_${aircraft?.icao24 || 'global'}`;
    lastAlerts.set(key, Date.now());

    // Auto-save critical alerts
    if ([ALERTS_CONFIG.severity.CRITICAL, ALERTS_CONFIG.severity.HIGH].includes(severity)) {
      this.autoSave().catch(err => console.error('Auto-save failed:', err));
    }

    console.log(`🚨 ${type} - ${severity} ${aircraft ? `(${aircraft.callsign || aircraft.icao24})` : ''}`);
    return alert;
  }

  static async autoSave() {
    await StorageManager.saveCurrent();
    await StorageManager.saveDaily();
  }

  static cleanup() {
    const cutoffTime = Date.now() - ALERTS_CONFIG.alertRetentionTime;
    alertsCache = alertsCache.filter(alert => alert.timestamp > cutoffTime);
    
    // Cleanup aircraft history
    const historyCutoff = Date.now() - (2 * ALERTS_CONFIG.alertRetentionTime);
    for (const [icao24, history] of aircraftHistory.entries()) {
      const filtered = history.filter(data => data.timestamp > historyCutoff);
      if (filtered.length === 0) {
        aircraftHistory.delete(icao24);
      } else {
        aircraftHistory.set(icao24, filtered);
      }
    }
  }
}

// ================================
// Storage Management
// ================================
class StorageManager {
  static async loadCurrent() {
    try {
      const data = await FileManager.loadJSON(paths.current());
      if (data && data.alerts && Array.isArray(data.alerts)) {
        alertsCache = data.alerts;
        console.log(`📂 Loaded ${alertsCache.length} alerts`);
      } else {
        console.log('📄 No valid alerts data found, starting fresh');
        alertsCache = [];
      }
    } catch (error) {
      console.error('❌ Error loading current alerts:', error.message);
      alertsCache = [];
    }
  }

  static async loadHistorical() {
    try {
      const data = await FileManager.loadJSON(paths.historical());
      return (data && data.alerts && Array.isArray(data.alerts)) ? data.alerts : [];
    } catch (error) {
      console.error('❌ Error loading historical alerts:', error.message);
      return [];
    }
  }

  static async saveCurrent() {
    const data = {
      alerts: alertsCache,
      metadata: {
        lastSaved: new Date().toISOString(),
        count: alertsCache.length
      }
    };

    const size = await FileManager.safeSave(paths.current(), data, ALERTS_CONFIG.storage.maxCurrentFileSize);
    
    // Archive if too big
    if (size > ALERTS_CONFIG.storage.maxCurrentFileSize) {
      await this.archive();
      alertsCache = alertsCache.slice(-Math.floor(alertsCache.length / 4));
      console.log('📦 Archived and pruned alerts');
    }
  }

  static async saveDaily() {
    if (!ALERTS_CONFIG.storage.createDailyFiles) return;

    const today = new Date();
    const startOfDay = new Date(today).setHours(0, 0, 0, 0);
    const endOfDay = new Date(today).setHours(23, 59, 59, 999);

    const dailyAlerts = alertsCache.filter(alert => 
      alert.timestamp >= startOfDay && alert.timestamp <= endOfDay
    );

    if (dailyAlerts.length === 0) return;

    const data = {
      date: today.toISOString().split('T')[0],
      alerts: dailyAlerts,
      metadata: { created: new Date().toISOString(), count: dailyAlerts.length }
    };

    await FileManager.saveJSON(paths.daily(today), data);
  }

  static async archive() {
    try {
      const historical = await this.loadHistorical() || [];
      const combined = [...historical, ...alertsCache];

      const data = {
        alerts: combined,
        metadata: {
          lastArchived: new Date().toISOString(),
          count: combined.length
        }
      };

      await FileManager.saveJSON(paths.historical(), data);
      console.log(`📚 Archived ${alertsCache.length} alerts`);
    } catch (error) {
      console.error('Archive failed:', error.message);
    }
  }
}

// ================================
// Detection Engine
// ================================
class DetectionEngine {
  static updateHistory(aircraftData) {
    const { icao24 } = aircraftData;
    if (!aircraftHistory.has(icao24)) {
      aircraftHistory.set(icao24, []);
    }
    
    const history = aircraftHistory.get(icao24);
    history.push({ ...aircraftData, timestamp: Date.now() });
    
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    return history;
  }

  static detectSharpTurn(current, history) {
    if (!ALERTS_CONFIG.detection.sharpTurn.enabled || history.length < 2) return null;
    
    const previous = history[history.length - 1];
    const timeDiff = current.timestamp - previous.timestamp;
    
    if (timeDiff > ALERTS_CONFIG.detection.sharpTurn.timeWindow) return null;
    
    const currentHeading = current.movement.headingDegrees;
    const previousHeading = previous.movement.headingDegrees;
    
    if (!currentHeading || !previousHeading) return null;
    
    const angleChange = MathUtils.angleDifference(currentHeading, previousHeading);
    
    if (angleChange >= ALERTS_CONFIG.detection.sharpTurn.minAngleChange) {
      return { angleChange, previousHeading, currentHeading, timeDiff: timeDiff / 1000 };
    }
    
    return null;
  }

  static detectHoldingPattern(current, history) {
    if (!ALERTS_CONFIG.detection.holdingPattern.enabled || history.length < 10) return null;
    
    const config = ALERTS_CONFIG.detection.holdingPattern;
    const recent = history.slice(-10);
    
    // Calculate center point
    const centerLat = recent.reduce((sum, data) => sum + data.position.latitude, 0) / recent.length;
    const centerLon = recent.reduce((sum, data) => sum + data.position.longitude, 0) / recent.length;
    
    // Check radius
    const distances = recent.map(data => 
      MathUtils.distance(centerLat, centerLon, data.position.latitude, data.position.longitude)
    );
    const maxDistance = Math.max(...distances);
    
    if (maxDistance > config.maxRadius) return null;
    
    // Check speed
    const avgSpeed = recent.reduce((sum, data) => sum + (data.movement.groundSpeedKnots || 0), 0) / recent.length;
    if (avgSpeed > config.maxSpeed) return null;
    
    // Check rotation
    let totalRotation = 0;
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i-1].movement.headingDegrees;
      const curr = recent[i].movement.headingDegrees;
      if (prev && curr) {
        totalRotation += MathUtils.angleDifference(prev, curr);
      }
    }
    
    if (totalRotation >= config.minCircularMovement) {
      return {
        centerLat, centerLon,
        radius: Math.round(maxDistance),
        avgSpeed: Math.round(avgSpeed),
        totalRotation: Math.round(totalRotation)
      };
    }
    
    return null;
  }

  static detectNorthwardDiversion(current, history) {
    if (!ALERTS_CONFIG.detection.northwardDiversion.enabled || history.length < 2) return null;
    
    const config = ALERTS_CONFIG.detection.northwardDiversion;
    const previous = history[history.length - 1];
    
    const currentHeading = current.movement.headingDegrees;
    const previousHeading = previous.movement.headingDegrees;
    
    if (!currentHeading || !previousHeading) return null;
    
    const angleChange = MathUtils.angleDifference(currentHeading, previousHeading);
    
    if (angleChange >= config.minAngleChange && MathUtils.isNorthward(currentHeading)) {
      return {
        previousHeading, currentHeading, angleChange,
        wasNorthward: MathUtils.isNorthward(previousHeading),
        isNorthward: true
      };
    }
    
    return null;
  }

  static detectApproachAbort(current, history) {
    if (!ALERTS_CONFIG.detection.approachAbort.enabled || history.length < 2) return null;
    
    const config = ALERTS_CONFIG.detection.approachAbort;
    const airportLocation = AIRPORT_CONFIG.location;
    
    const distanceToAirport = MathUtils.distance(
      current.position.latitude, current.position.longitude,
      airportLocation.latitude, airportLocation.longitude
    );
    
    if (distanceToAirport > config.airportRadius) return null;
    
    const altitude = current.position.altitudeFeet;
    if (!altitude || altitude > config.maxApproachAltitude) return null;
    
    const previous = history[history.length - 1];
    const currentHeading = current.movement.headingDegrees;
    const previousHeading = previous.movement.headingDegrees;
    
    if (!currentHeading || !previousHeading) return null;
    
    const angleChange = MathUtils.angleDifference(currentHeading, previousHeading);
    
    if (angleChange >= config.minDeviationAngle) {
      return {
        distanceToAirport: Math.round(distanceToAirport),
        altitude, angleChange, currentHeading, previousHeading
      };
    }
    
    return null;
  }

  static detectEmergencyCode(current) {
    if (!ALERTS_CONFIG.detection.emergencyCodes.enabled) return null;
    
    const squawkCode = current.status.squawkCode;
    if (!squawkCode || !ALERTS_CONFIG.detection.emergencyCodes.codes.includes(squawkCode)) return null;
    
    const codeTypes = {
      7700: 'EMERGENCY',
      7600: 'COMMUNICATION_FAILURE', 
      7500: 'HIJACK',
      7400: 'RADIO_FAILURE',
      7777: 'MILITARY_INTERCEPTION'
    };
    
    return {
      code: squawkCode,
      codeType: codeTypes[squawkCode] || 'UNKNOWN'
    };
  }

  static detectSuddenChange(current, history, type) {
    const configs = {
      speed: ALERTS_CONFIG.detection.suddenSpeedChange,
      altitude: ALERTS_CONFIG.detection.suddenAltitudeChange
    };
    
    const config = configs[type];
    if (!config?.enabled || history.length < 2) return null;
    
    const previous = history[history.length - 1];
    const timeDiff = current.timestamp - previous.timestamp;
    
    if (timeDiff > config.timeWindow) return null;
    
    if (type === 'speed') {
      const currentSpeed = current.movement.groundSpeedKnots || 0;
      const previousSpeed = previous.movement.groundSpeedKnots || 0;
      
      if (previousSpeed === 0) return null;
      
      const speedChangePct = Math.abs(currentSpeed - previousSpeed) / previousSpeed * 100;
      
      if (speedChangePct >= config.minSpeedChangePct) {
        return {
          previousSpeed, currentSpeed,
          speedChange: currentSpeed - previousSpeed,
          speedChangePct: Math.round(speedChangePct),
          timeDiff: timeDiff / 1000
        };
      }
    } else if (type === 'altitude') {
      const currentAlt = current.position.altitudeFeet;
      const previousAlt = previous.position.altitudeFeet;
      
      if (!currentAlt || !previousAlt) return null;
      
      const altitudeChange = Math.abs(currentAlt - previousAlt);
      
      if (altitudeChange >= config.minAltitudeChangeFt) {
        return {
          previousAltitude: previousAlt,
          currentAltitude: currentAlt,
          altitudeChange: currentAlt - previousAlt,
          altitudeChangeAbs: altitudeChange,
          timeDiff: timeDiff / 1000
        };
      }
    }
    
    return null;
  }

  static analyzeAircraft(aircraftData) {
    const history = this.updateHistory(aircraftData);
    const current = { ...aircraftData, timestamp: Date.now() };
    const alerts = [];

    // Detection rules with severity mapping
    const detections = [
      { fn: () => this.detectEmergencyCode(current), type: 'EMERGENCY_CODE', severity: 'CRITICAL' },
      { fn: () => this.detectSuddenChange(current, history, 'speed'), type: 'SUDDEN_SPEED_CHANGE', severity: 'MEDIUM' },
      { fn: () => this.detectSuddenChange(current, history, 'altitude'), type: 'SUDDEN_ALTITUDE_CHANGE', severity: 'MEDIUM' },
      { fn: () => this.detectSharpTurn(current, history), type: 'SHARP_TURN', severity: 'HIGH' },
      { fn: () => this.detectHoldingPattern(current, history), type: 'HOLDING_PATTERN', severity: 'CRITICAL' },
      { fn: () => this.detectNorthwardDiversion(current, history), type: 'NORTHWARD_DIVERSION', severity: 'CRITICAL' },
      { fn: () => this.detectApproachAbort(current, history), type: 'APPROACH_ABORT', severity: 'CRITICAL' }
    ];

    for (const { fn, type, severity } of detections) {
      const detection = fn();
      if (detection && AlertManager.canSendAlert(type, aircraftData.icao24)) {
        alerts.push(AlertManager.createAlert(type, severity, aircraftData, detection));
      }
    }

    return alerts;
  }
}

// ================================
// Auto-save System
// ================================
class AutoSaveSystem {
  static start() {
    if (!ALERTS_CONFIG.storage.autoSave || autoSaveTimer) return;
    
    autoSaveTimer = setInterval(async () => {
      try {
        await StorageManager.saveCurrent();
        await StorageManager.saveDaily();
      } catch (error) {
        console.error('Auto-save error:', error.message);
      }
    }, ALERTS_CONFIG.storage.saveInterval);
    
    console.log(`💾 Auto-save: every ${ALERTS_CONFIG.storage.saveInterval / 1000}s`);
  }

  static stop() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  }
}

// ================================
// Public API
// ================================

// System lifecycle
export async function initializeAlertSystem() {
  try {
    await FileManager.ensureDirectories();
    await StorageManager.loadCurrent();
    AutoSaveSystem.start();
    console.log('🚨 Alert system initialized');
  } catch (error) {
    console.error('❌ Alert system initialization failed:', error.message);
    
    // Try to create fresh files if initialization fails
    console.log('🔧 Attempting to create fresh alert files...');
    try {
      alertsCache = [];
      await StorageManager.saveCurrent();
      console.log('✅ Fresh alert files created');
    } catch (createError) {
      console.error('❌ Failed to create fresh files:', createError.message);
      throw createError;
    }
  }
}

export async function shutdownAlertSystem() {
  console.log('🛑 Shutting down...');
  AutoSaveSystem.stop();
  
  if (alertsCache.length > 0) {
    await StorageManager.archive();
  }
  await StorageManager.saveCurrent();
  await StorageManager.saveDaily();
  
  console.log('💾 Shutdown complete');
  return { success: true, message: 'Graceful shutdown', finalCount: alertsCache.length };
}

// Analysis
export async function analyzeAlerts(aircraftList) {
  AlertManager.cleanup();
  
  const newAlerts = [];
  for (const aircraft of aircraftList) {
    newAlerts.push(...DetectionEngine.analyzeAircraft(aircraft));
  }
  
  // Composite alerts
  const recentAlerts = [...alertsCache, ...newAlerts].filter(alert => 
    (Date.now() - alert.timestamp) < ALERTS_CONFIG.composite.securityAlert.timeWindow
  );
  
  if (recentAlerts.length >= ALERTS_CONFIG.composite.securityAlert.minEvents && 
      AlertManager.canSendAlert('SECURITY_ALERT')) {
    
    const severityCounts = {};
    const typeCounts = {};
    recentAlerts.forEach(alert => {
      severityCounts[alert.severity] = (severityCounts[alert.severity] || 0) + 1;
      typeCounts[alert.type] = (typeCounts[alert.type] || 0) + 1;
    });
    
    newAlerts.push(AlertManager.createAlert('SECURITY_ALERT', 'HIGH', null, {
      alertCount: recentAlerts.length,
      severityBreakdown: severityCounts,
      typeBreakdown: typeCounts,
      affectedAircraft: [...new Set(recentAlerts.map(a => a.aircraft?.icao24).filter(Boolean))].length
    }));
  }
  
  return { newAlerts, totalNewAlerts: newAlerts.length };
}

// Data access
export function getActiveAlerts() {
  AlertManager.cleanup();
  return alertsCache.filter(alert => alert.active);
}

export function getAllAlerts() {
  AlertManager.cleanup();
  return alertsCache;
}

export function getAlertsByType(type) {
  AlertManager.cleanup();
  return alertsCache.filter(alert => alert.type === type);
}

export function getAlertsBySeverity(severity) {
  AlertManager.cleanup();
  return alertsCache.filter(alert => alert.severity === severity);
}

export function getAlertsStats() {
  AlertManager.cleanup();
  
  const stats = { total: alertsCache.length, active: 0, bySeverity: {}, byType: {}, last24Hours: 0, lastHour: 0 };
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  
  alertsCache.forEach(alert => {
    if (alert.active) stats.active++;
    stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
    stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    
    const age = now - alert.timestamp;
    if (age < hour) stats.lastHour++;
    if (age < day) stats.last24Hours++;
  });
  
  return stats;
}

// File operations
export async function saveAlerts() {
  try {
    await StorageManager.saveCurrent();
    await StorageManager.saveDaily();
    return { success: true, message: 'Saved', alertCount: alertsCache.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function reloadAlerts() {
  try {
    await StorageManager.loadCurrent();
    return { success: true, message: 'Reloaded', alertCount: alertsCache.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function clearAllAlerts() {
  const count = alertsCache.length;
  if (count > 0) {
    StorageManager.archive().catch(err => console.error('Archive failed:', err));
  }
  alertsCache = [];
  lastAlerts.clear();
  StorageManager.saveCurrent().catch(err => console.error('Save failed:', err));
  return { success: true, clearedCount: count, message: `Cleared ${count} alerts (archived)` };
}

// Historical data
export async function getFullHistory() {
  try {
    const historical = await StorageManager.loadHistorical();
    const all = [...historical, ...alertsCache].sort((a, b) => b.timestamp - a.timestamp);
    return { success: true, alerts: all, totalCount: all.length, historicalCount: historical.length, currentCount: alertsCache.length };
  } catch (error) {
    return { success: false, error: error.message, alerts: [] };
  }
}

export async function getAlertsByDateRange(startDate, endDate) {
  try {
    const { alerts } = await getFullHistory();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const filtered = alerts.filter(alert => alert.timestamp >= start && alert.timestamp <= end);
    return { success: true, alerts: filtered, count: filtered.length, dateRange: { startDate, endDate } };
  } catch (error) {
    return { success: false, error: error.message, alerts: [] };
  }
}

export async function getDailyAlerts(date) {
  try {
    const data = await FileManager.loadJSON(paths.daily(new Date(date)));
    return data ? { success: true, ...data } : { success: false, error: 'No data for date', alerts: [], count: 0 };
  } catch (error) {
    return { success: false, error: error.message, alerts: [], count: 0 };
  }
}

export async function getAvailableDailyFiles() {
  try {
    const files = await fs.readdir(ALERTS_CONFIG.storage.alertsDirectory);
    const dailyFiles = files
      .filter(file => file.match(/alerts_\d{4}-\d{2}-\d{2}\.json/))
      .map(file => ({
        fileName: file,
        date: file.match(/alerts_(\d{4}-\d{2}-\d{2})\.json/)?.[1],
        fullPath: path.join(ALERTS_CONFIG.storage.alertsDirectory, file)
      }))
      .filter(file => file.date)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    return { success: true, files: dailyFiles, count: dailyFiles.length };
  } catch (error) {
    return { success: false, error: error.message, files: [] };
  }
}

// System info
export function testAlertSystem() {
  return {
    success: true,
    alertsInMemory: alertsCache.length,
    aircraftTracked: aircraftHistory.size,
    storage: {
      directory: ALERTS_CONFIG.storage.alertsDirectory,
      autoSave: ALERTS_CONFIG.storage.autoSave,
      interval: `${ALERTS_CONFIG.storage.saveInterval / 1000}s`
    },
    sensitivity: { level: 'MAXIMUM', note: 'All thresholds set to maximum sensitivity' },
    detectionEnabled: Object.entries(ALERTS_CONFIG.detection).reduce((acc, [key, config]) => {
      if (config.enabled !== undefined) {
        acc[key] = `${config.enabled} (${config.minAngleChange || config.minSpeedChangePct || config.minAltitudeChangeFt || 'various'}${config.minAngleChange ? '°' : config.minSpeedChangePct ? '%' : config.minAltitudeChangeFt ? 'ft' : ''})`;
      }
      return acc;
    }, {})
  };
}