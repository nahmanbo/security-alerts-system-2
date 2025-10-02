// src/services/systemService.js
import { SYSTEM_CONFIG } from "../config/system.js";
import { AIRPORT_CONFIG } from "../config/airport.js";

// =========================
//   Module state (מצב מודול)
// =========================

// Capture service boot time / זמן עליית השירות
const START_TIME_MS = Date.now();

// Build endpoints once with sane defaults / בניית מסלולי קצה פעם אחת עם ברירות מחדל
function buildEndpoints(base = "/api") {
  const apiBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return Object.freeze({
    health: "/health",
    info: "/info",
    alerts: `${apiBase}/alerts`,
    monitor: `${apiBase}/monitor`,
    aircraft: `${apiBase}/aircraft`,
    collection: `${apiBase}/collection`
  });
}

const ENDPOINTS = buildEndpoints("/api");

// Safe read for airport radius as number / קריאה בטוחה לרדיוס שדה כתו מספר
function getMonitoringRadiusKm() {
  const r = AIRPORT_CONFIG?.monitoringRadius;
  const n = typeof r === "string" ? Number(r.replace(/[^0-9.]/g, "")) : r;
  return Number.isFinite(n) ? n : null;
}

// Optional bounds if available / גבולות אופציונליים אם קיימים
function getAirportBoundsSafe() {
  try {
    if (typeof AIRPORT_CONFIG?.getBounds === "function") {
      const b = AIRPORT_CONFIG.getBounds();
      return {
        north: b?.north ?? null,
        south: b?.south ?? null,
        east:  b?.east  ?? null,
        west:  b?.west  ?? null
      };
    }
  } catch { /* ignore */ }
  return null;
}

// =========================
//   Public API (ממשק ציבורי)
// =========================

// Get system health snapshot / קבלת צילום מצב בריאות המערכת
export function getSystemHealth() {
  const uptimeSec = Math.floor(process.uptime?.() ?? (Date.now() - START_TIME_MS) / 1000);
  return {
    status: "healthy",
    service: SYSTEM_CONFIG?.name ?? "security-alerts-system",
    version: SYSTEM_CONFIG?.version ?? "0.0.0",
    env: process.env.NODE_ENV || "development",
    node: process.versions?.node,
    startedAt: new Date(START_TIME_MS).toISOString(),
    uptimeSec
  };
}

// Get system information and configuration / קבלת מידע על המערכת והקונפיגורציה
export function getSystemInfo() {
  const radiusKm = getMonitoringRadiusKm();
  const bounds = getAirportBoundsSafe();

  return {
    name: SYSTEM_CONFIG?.name ?? "security-alerts-system",
    description: "Aviation security monitoring system",
    version: SYSTEM_CONFIG?.version ?? "0.0.0",
    env: process.env.NODE_ENV || "development",
    node: process.versions?.node,
    startedAt: new Date(START_TIME_MS).toISOString(),
    airport: {
      name: AIRPORT_CONFIG?.name ?? null,
      icao: AIRPORT_CONFIG?.icao ?? null,
      coordinates: AIRPORT_CONFIG?.coordinates ?? null,
      monitoringRadiusKm: radiusKm,
      bounds
    },
    endpoints: ENDPOINTS
  };
}
