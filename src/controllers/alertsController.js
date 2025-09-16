// src/controllers/alertsController.js
import * as alertsService from "../services/alertsService.js";

// Get all alerts
export function getAlerts(req, res) {
  try {
    const alerts = alertsService.getAllAlerts();
    res.json({success: true, alerts, count: alerts.length, timestamp: Date.now()});
  } catch (error) {
    res.status(500).json({success: false, error: error.message, timestamp: Date.now()});
  }
}

// Get alert by ID
export function getAlert(req, res) {
  try {
    const { id } = req.params;
    const alert = alertsService.getAlertById(id);
    
    if (!alert) {
      return res.status(404).json({success: false, error: "Alert not found", timestamp: Date.now()});
    }
    
    res.json({success: true, alert, timestamp: Date.now()});
  } catch (error) {
    res.status(500).json({success: false, error: error.message, timestamp: Date.now()});
  }
}