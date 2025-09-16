// src/controllers/systemController.js
import * as systemService from "../services/systemService.js";

// Get system health status
export function getHealth(req, res) {
  try {
    const health = systemService.getSystemHealth();
    res.json({success: true, ...health, timestamp: Date.now()});
  } catch (error) {
    res.status(500).json({success: false, error: error.message, timestamp: Date.now()});
  }
}

// Get system information
export function getInfo(req, res) {
  try {
    const info = systemService.getSystemInfo();
    res.json({success: true, ...info, timestamp: Date.now()});
  } catch (error) {
    res.status(500).json({success: false, error: error.message, timestamp: Date.now()});
  }
}