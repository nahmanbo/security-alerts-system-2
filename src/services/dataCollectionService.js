// src/services/dataCollectionService.js
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

import { getAircraftData } from './aircraftService.js';
import { SYSTEM_CONFIG } from '../config/system.js';

let collectionInterval = null;
let isCollecting = false;
let collectionStats = {
  totalRuns: 0,
  successfulRuns: 0,
  lastRun: null,
  lastSuccess: null,
  lastError: null,
  filesCreated: 0
};

const DATA_DIRS = {
  flights: './data/flights',
  alerts: './data/alerts'
};

// Ensure data directories exist
async function ensureDataDirectories() {
  for (const dir of Object.values(DATA_DIRS)) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }
}

// Generate filename for time window (every 5 minutes)
function generateFlightsFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = Math.floor(now.getMinutes() / 5) * 5; // Round down to 5-minute intervals
  const roundedMinute = String(minute).padStart(2, '0');
  
  return `flights-${year}-${month}-${day}_${hour}-${roundedMinute}.json`;
}

// Generate emergency alerts filename
function generateAlertsFilename() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `emergency-alerts-${dateStr}.json`;
}

// Check for emergency squawk codes
function detectEmergencyAlerts(aircraft) {
  const emergencyCodes = {
    7700: 'EMERGENCY',
    7600: 'RADIO_FAILURE', 
    7500: 'HIJACK'
  };
  
  const alerts = [];
  const timestamp = Date.now();
  
  for (const plane of aircraft) {
    if (plane.status.squawkCode && emergencyCodes[plane.status.squawkCode]) {
      alerts.push({
        id: `${plane.icao24}_${plane.status.squawkCode}_${timestamp}`,
        timestamp,
        detectionTime: new Date().toISOString(),
        aircraft: {
          icao24: plane.icao24,
          callsign: plane.callsign,
          originCountry: plane.originCountry,
          position: plane.position,
          movement: plane.movement
        },
        emergency: {
          squawkCode: plane.status.squawkCode,
          type: emergencyCodes[plane.status.squawkCode],
          severity: plane.status.squawkCode === 7500 ? 'CRITICAL' : 
                   plane.status.squawkCode === 7700 ? 'HIGH' : 'MEDIUM'
        }
      });
    }
  }
  
  return alerts;
}

// Save emergency alerts to daily log file
async function saveEmergencyAlerts(alerts) {
  if (alerts.length === 0) return;
  
  try {
    const filename = generateAlertsFilename();
    const filepath = path.join(DATA_DIRS.alerts, filename);
    
    let existingAlerts = [];
    if (existsSync(filepath)) {
      const content = await readFile(filepath, 'utf8');
      const data = JSON.parse(content);
      existingAlerts = data.alerts || [];
    }
    
    const fileData = {
      date: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
      alerts: [...existingAlerts, ...alerts],
      totalAlerts: existingAlerts.length + alerts.length
    };
    
    await writeFile(filepath, JSON.stringify(fileData, null, 2));
    console.log(`🚨 Saved ${alerts.length} emergency alerts to ${filename}`);
    
    // Log each alert to console
    alerts.forEach(alert => {
      console.log(`⚠️  EMERGENCY: ${alert.aircraft.callsign || alert.aircraft.icao24} - Code ${alert.emergency.squawkCode} (${alert.emergency.type})`);
    });
    
  } catch (error) {
    console.error(`❌ Failed to save emergency alerts: ${error.message}`);
  }
}

// Save flights data to 5-minute window file
async function saveFlightsData(aircraftData) {
  try {
    const filename = generateFlightsFilename();
    const filepath = path.join(DATA_DIRS.flights, filename);
    
    const timestamp = Date.now();
    const newEntry = {
      timestamp,
      collectionTime: new Date().toISOString(),
      metadata: aircraftData.metadata,
      aircraft: aircraftData.aircraft,
      count: aircraftData.count
    };
    
    let existingData = { collections: [] };
    if (existsSync(filepath)) {
      const content = await readFile(filepath, 'utf8');
      existingData = JSON.parse(content);
    }
    
    existingData.collections.push(newEntry);
    existingData.lastUpdated = new Date().toISOString();
    existingData.totalCollections = existingData.collections.length;
    
    await writeFile(filepath, JSON.stringify(existingData, null, 2));
    collectionStats.filesCreated++;
    
    console.log(`💾 Added ${aircraftData.count} aircraft to ${filename} (${existingData.totalCollections} collections)`);
    return filepath;
  } catch (error) {
    console.error(`❌ Failed to save flights data: ${error.message}`);
    throw error;
  }
}

// Single data collection run
async function collectData() {
  const startTime = Date.now();
  collectionStats.totalRuns++;
  collectionStats.lastRun = startTime;
  
  try {
    console.log(`🔄 Collecting aircraft data... (Run #${collectionStats.totalRuns})`);
    
    const aircraftData = await getAircraftData();
    
    if (aircraftData.success && aircraftData.count > 0) {
      await ensureDataDirectories();
      
      // Save flights data
      await saveFlightsData(aircraftData);
      
      // Check and save emergency alerts
      const emergencyAlerts = detectEmergencyAlerts(aircraftData.aircraft);
      if (emergencyAlerts.length > 0) {
        await saveEmergencyAlerts(emergencyAlerts);
      }
      
      collectionStats.successfulRuns++;
      collectionStats.lastSuccess = Date.now();
      collectionStats.lastError = null;
      
      const duration = Date.now() - startTime;
      console.log(`✅ Collection completed: ${aircraftData.count} aircraft, ${emergencyAlerts.length} alerts in ${duration}ms`);
      
      return {
        success: true,
        aircraft: aircraftData.aircraft,
        count: aircraftData.count,
        emergencyAlerts: emergencyAlerts.length,
        duration
      };
    } else {
      throw new Error(aircraftData.error || 'No aircraft data received');
    }
    
  } catch (error) {
    collectionStats.lastError = {
      timestamp: Date.now(),
      message: error.message
    };
    
    console.error(`❌ Collection failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// Start automatic data collection
export function startCollection() {
  if (isCollecting) {
    console.log('⚠️ Collection already running');
    return { success: false, message: 'Collection already running' };
  }
  
  const intervalMs = SYSTEM_CONFIG.dataCollection.intervalSeconds * 1000;
  
  console.log(`🚀 Starting automatic data collection (every ${SYSTEM_CONFIG.dataCollection.intervalSeconds}s)`);
  console.log(`📁 Flights data: ${DATA_DIRS.flights}`);
  console.log(`🚨 Alerts data: ${DATA_DIRS.alerts}`);
  
  // Run immediately
  collectData();
  
  // Set up interval
  collectionInterval = setInterval(collectData, intervalMs);
  isCollecting = true;
  
  return {
    success: true,
    message: `Data collection started (interval: ${SYSTEM_CONFIG.dataCollection.intervalSeconds}s)`,
    intervalSeconds: SYSTEM_CONFIG.dataCollection.intervalSeconds,
    directories: DATA_DIRS
  };
}

// Stop automatic data collection
export function stopCollection() {
  if (!isCollecting) {
    return { success: false, message: 'Collection not running' };
  }
  
  if (collectionInterval) {
    clearInterval(collectionInterval);
    collectionInterval = null;
  }
  
  isCollecting = false;
  console.log('⏹️ Data collection stopped');
  
  return {
    success: true,
    message: 'Data collection stopped',
    stats: getCollectionStats()
  };
}

// Get collection statistics
export function getCollectionStats() {
  return {
    ...collectionStats,
    isRunning: isCollecting,
    intervalSeconds: SYSTEM_CONFIG.dataCollection.intervalSeconds,
    successRate: collectionStats.totalRuns > 0 ? 
      Math.round((collectionStats.successfulRuns / collectionStats.totalRuns) * 100) : 0,
    nextRun: isCollecting && collectionStats.lastRun ? 
      collectionStats.lastRun + (SYSTEM_CONFIG.dataCollection.intervalSeconds * 1000) : null,
    directories: DATA_DIRS
  };
}

// Get collection status
export function isCollectionRunning() {
  return isCollecting;
}

// Manual collection trigger
export async function triggerCollection() {
  if (!SYSTEM_CONFIG.dataCollection.enabled) {
    return { success: false, message: 'Data collection is disabled in config' };
  }
  
  console.log('🎯 Manual data collection triggered');
  return await collectData();
}