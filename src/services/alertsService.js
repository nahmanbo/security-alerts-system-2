// src/services/alertsService.js

// נתונים דמה זמניים
const alerts = [
    {
      id: "1",
      type: "EMERGENCY_CODE",
      severity: "HIGH",
      description: "Aircraft broadcasting emergency code 7700",
      timestamp: Date.now() - 300000, // לפני 5 דקות
      aircraft: {
        icao24: "abc123",
        callsign: "ELY001"
      }
    },
    {
      id: "2", 
      type: "TRAFFIC_HALT",
      severity: "CRITICAL",
      description: "Sudden halt in airport traffic detected",
      timestamp: Date.now() - 120000, // לפני 2 דקות
      aircraft: {
        count: 0
      }
    }
  ];
  
  export function getAllAlerts() {
    return alerts;
  }
  
  export function getAlertById(id) {
    return alerts.find(alert => alert.id === id);
  }