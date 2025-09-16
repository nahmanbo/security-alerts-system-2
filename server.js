import "dotenv/config";
import express from "express";
import cors from "cors";

import { logger } from "./src/utils/logger.js";
import { SYSTEM_CONFIG } from "./src/config/system.js";
import alertsRouter from "./src/routes/alertsRouter.js";
import systemRouter from "./src/routes/systemRouter.js";
import aircraftRouter from "./src/routes/aircraftRouter.js";

const app = express();

// ================================
// Middleware
// ================================
app.use(express.json());
app.use(cors({
  origin: SYSTEM_CONFIG.cors.origins,
  credentials: true
})); 
app.use(logger);

// ================================
// Routes
// ================================
app.use("/", systemRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/aircraft", aircraftRouter);

// ================================
// Start Server
// ================================
app.listen(SYSTEM_CONFIG.port, () => {
  console.log(`🛡️ ${SYSTEM_CONFIG.name} v${SYSTEM_CONFIG.version}`);
  console.log(`🌐 Server: http://localhost:${SYSTEM_CONFIG.port}`);
  console.log(`🚨 Alerts: http://localhost:${SYSTEM_CONFIG.port}/api/alerts`);
  console.log(`✈️  Aircraft: http://localhost:${SYSTEM_CONFIG.port}/api/aircraft`);
  console.log(`🔐 OpenSky Auth: ${process.env.OPENSKY_CLIENT_ID ? 'ENABLED' : 'DISABLED'}`);
});