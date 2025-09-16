// src/services/systemService.js

export function getSystemHealth() {
    return {
      status: "healthy",
      service: "Ben Gurion Security Alerts System",
      version: "1.0.0"
    };
  }
  
  export function getSystemInfo() {
    return {
      name: "Ben Gurion Security Alerts System",
      description: "Aviation security monitoring system",
      version: "1.0.0",
      endpoints: {
        health: "/health",
        info: "/info", 
        alerts: "/api/alerts"
      }
    };
  }