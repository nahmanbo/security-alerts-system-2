import { SYSTEM_CONFIG } from "../config/system.js";
import { AIRPORT_CONFIG } from "../config/airport.js";

export function getSystemHealth() {
  return {
    status: "healthy",
    service: SYSTEM_CONFIG.name,
    version: SYSTEM_CONFIG.version
  };
}

export function getSystemInfo() {
  return {
    name: SYSTEM_CONFIG.name,
    description: "Aviation security monitoring system",
    version: SYSTEM_CONFIG.version,
    airport: {
      name: AIRPORT_CONFIG.name,
      icao: AIRPORT_CONFIG.icao,
      coordinates: AIRPORT_CONFIG.coordinates,
      monitoringRadius: `${AIRPORT_CONFIG.monitoringRadius}km`
    },
    endpoints: {
      health: "/health",
      info: "/info", 
      alerts: "/api/alerts",
      aircraft: "/api/aircraft",
      collection: "/api/collection"
    }
  };
}