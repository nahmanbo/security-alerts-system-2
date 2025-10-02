import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";

import { logger } from "./src/utils/logger.js";
import { SYSTEM_CONFIG } from "./src/config/system.js";
import { initializeAlertSystem } from "./src/services/alertsService.js";

import alertsRouter from "./src/routes/alertsRouter.js";
import systemRouter from "./src/routes/systemRouter.js";
import aircraftRouter from "./src/routes/aircraftRouter.js";
import collectionRouter from "./src/routes/collectionRouter.js";
import monitorRouter from "./src/routes/monitorRouter.js";

const app = express();

// ================================
// Middleware
// ================================
app.use(express.json());
app.use(
  cors({ origin: SYSTEM_CONFIG.cors.origins, credentials: true })
);
app.use(logger);
app.use((req, res, next) => {
  res.locals.requestId = crypto.randomUUID();
  next();
});

// ================================
// Routes
// ================================
app.use("/", systemRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/aircraft", aircraftRouter);
app.use("/api/collection", collectionRouter);
app.use("/api/monitor", monitorRouter);

// ================================
// Start Server
// ================================
async function startServer() {
  try {
    await initializeAlertSystem();
    console.log("✅ Alert system ready");

    const server = app.listen(SYSTEM_CONFIG.port, () => {
      console.log(`🛡️ ${SYSTEM_CONFIG.name} v${SYSTEM_CONFIG.version}`);
      console.log(`🌐 Server:      http://localhost:${SYSTEM_CONFIG.port}`);
      console.log(`🚨 Alerts:      http://localhost:${SYSTEM_CONFIG.port}/api/alerts`);
      console.log(`📈 Monitor:     http://localhost:${SYSTEM_CONFIG.port}/api/monitor`);
      console.log(`✈️  Aircraft:    http://localhost:${SYSTEM_CONFIG.port}/api/aircraft`);
      console.log(`📊 Collection:  http://localhost:${SYSTEM_CONFIG.port}/api/collection`);
      console.log(`🔐 OpenSky Auth: ${process.env.OPENSKY_CLIENT_ID ? "ENABLED" : "DISABLED"}`);
      console.log("🔥 MAXIMUM SENSITIVITY MODE - Detecting ALL changes!");
    });

    server.on("error", (err) => {
      console.error("💥 HTTP server error:", err?.message || err);
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error("💥 Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error("💥 Fatal error during startup:", error.message);
  process.exit(1);
});
