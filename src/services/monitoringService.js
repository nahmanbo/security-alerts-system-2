// src/services/monitoringService.js
import { analyzeAlerts } from './alertsService.js';
import { getAircraftData } from './aircraftService.js';

// ================================
// Monitoring State
// ================================
let isMonitoring = false;
let monitoringTimer = null;
let monitoringStats = {
  startedAt: null,
  lastRun: null,
  totalRuns: 0,
  totalAlertsGenerated: 0,
  errors: 0
};

// Default configuration
const MONITORING_CONFIG = {
  interval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  alertCallback: null // Optional callback for new alerts
};

// ================================
// Core Monitoring Functions
// ================================

async function runMonitoringCycle() {
  try {
    console.log('🔄 Running monitoring cycle...');
    monitoringStats.lastRun = new Date().toISOString();
    monitoringStats.totalRuns++;

    // Get current aircraft data
    const aircraftResult = await getAircraftData();
    
    if (!aircraftResult.success) {
      throw new Error(`Aircraft data fetch failed: ${aircraftResult.error}`);
    }

    // Analyze for alerts
    const analysisResult = await analyzeAlerts(aircraftResult.aircraft);
    
    if (analysisResult.totalNewAlerts > 0) {
      console.log(`🚨 MONITORING DETECTED ${analysisResult.totalNewAlerts} NEW ALERTS!`);
      monitoringStats.totalAlertsGenerated += analysisResult.totalNewAlerts;
      
      // Log each new alert
      analysisResult.newAlerts.forEach(alert => {
        console.log(`🚨 ${alert.type} - ${alert.severity} ${alert.aircraft ? `(${alert.aircraft.callsign || alert.aircraft.icao24})` : ''}`);
      });

      // Call alert callback if provided
      if (MONITORING_CONFIG.alertCallback) {
        MONITORING_CONFIG.alertCallback(analysisResult.newAlerts);
      }
    } else {
      console.log(`✅ Monitoring cycle complete - ${aircraftResult.count} aircraft analyzed, no new alerts`);
    }

    return {
      success: true,
      aircraftAnalyzed: aircraftResult.count,
      newAlerts: analysisResult.totalNewAlerts,
      alerts: analysisResult.newAlerts
    };

  } catch (error) {
    console.error('❌ Monitoring cycle error:', error.message);
    monitoringStats.errors++;
    
    return {
      success: false,
      error: error.message
    };
  }
}

async function scheduleNextRun() {
  if (!isMonitoring) return;
  
  monitoringTimer = setTimeout(async () => {
    if (isMonitoring) {
      const result = await runMonitoringCycle();
      
      // If error, implement retry logic
      if (!result.success && monitoringStats.errors < MONITORING_CONFIG.maxRetries) {
        console.log(`🔁 Retrying in ${MONITORING_CONFIG.retryDelay / 1000} seconds...`);
        setTimeout(scheduleNextRun, MONITORING_CONFIG.retryDelay);
      } else {
        scheduleNextRun();
      }
    }
  }, MONITORING_CONFIG.interval);
}

// ================================
// Public API
// ================================

export function startMonitoring(config = {}) {
  if (isMonitoring) {
    return {
      success: false,
      message: 'Monitoring is already running',
      status: getMonitoringStatus()
    };
  }

  // Apply custom configuration
  Object.assign(MONITORING_CONFIG, config);

  isMonitoring = true;
  monitoringStats.startedAt = new Date().toISOString();
  monitoringStats.totalRuns = 0;
  monitoringStats.totalAlertsGenerated = 0;
  monitoringStats.errors = 0;

  console.log(`🚀 Starting automatic monitoring every ${MONITORING_CONFIG.interval / 1000} seconds`);
  
  // Run first cycle immediately
  runMonitoringCycle().then(() => {
    scheduleNextRun();
  });

  return {
    success: true,
    message: 'Monitoring started successfully',
    status: getMonitoringStatus()
  };
}

export function stopMonitoring() {
  if (!isMonitoring) {
    return {
      success: false,
      message: 'Monitoring is not running',
      status: getMonitoringStatus()
    };
  }

  isMonitoring = false;
  
  if (monitoringTimer) {
    clearTimeout(monitoringTimer);
    monitoringTimer = null;
  }

  const finalStats = { ...monitoringStats };
  console.log('🛑 Automatic monitoring stopped');

  return {
    success: true,
    message: 'Monitoring stopped successfully',
    finalStats,
    status: getMonitoringStatus()
  };
}

export function getMonitoringStatus() {
  return {
    isRunning: isMonitoring,
    stats: {
      ...monitoringStats,
      uptime: monitoringStats.startedAt ? 
        Date.now() - new Date(monitoringStats.startedAt).getTime() : 0
    },
    config: {
      interval: MONITORING_CONFIG.interval,
      intervalSeconds: MONITORING_CONFIG.interval / 1000
    }
  };
}

export function updateMonitoringConfig(newConfig) {
  Object.assign(MONITORING_CONFIG, newConfig);
  
  return {
    success: true,
    message: 'Configuration updated',
    config: MONITORING_CONFIG
  };
}

export function setAlertCallback(callback) {
  MONITORING_CONFIG.alertCallback = callback;
  return {
    success: true,
    message: 'Alert callback configured'
  };
}

// Manual analysis (unchanged - works alongside monitoring)
export async function runManualAnalysis() {
  try {
    const aircraftResult = await getAircraftData();
    
    if (!aircraftResult.success) {
      return {
        success: false,
        error: aircraftResult.error
      };
    }

    const analysisResult = await analyzeAlerts(aircraftResult.aircraft);
    
    return {
      success: true,
      analysis: {
        aircraftAnalyzed: aircraftResult.count,
        newAlerts: analysisResult.newAlerts,
        totalNewAlerts: analysisResult.totalNewAlerts
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ================================
// System Integration
// ================================

export function initializeMonitoringSystem() {
  console.log('🔧 Monitoring system initialized (manual mode)');
  return {
    success: true,
    message: 'Monitoring system ready - use /api/alerts/monitor/start to begin automatic monitoring'
  };
}

export async function shutdownMonitoringSystem() {
  if (isMonitoring) {
    stopMonitoring();
  }
  
  console.log('🛑 Monitoring system shutdown complete');
  return {
    success: true,
    message: 'Monitoring system shut down gracefully'
  };
}