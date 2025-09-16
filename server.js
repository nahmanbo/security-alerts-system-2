import express from "express";
import cors from "cors";

import { logger } from "./src/utils/logger.js";
import { SYSTEM_CONFIG } from "./src/config/system.js";
import alertsRouter from "./src/routes/alertsRouter.js";
import systemRouter from "./src/routes/systemRouter.js";

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

// ================================
// Start Server
// ================================
app.listen(SYSTEM_CONFIG.port, () => {
  console.log(`🛡️ ${SYSTEM_CONFIG.name} v${SYSTEM_CONFIG.version}`);
  console.log(`🌐 Server: http://localhost:${SYSTEM_CONFIG.port}`);
  console.log(`🚨 API: http://localhost:${SYSTEM_CONFIG.port}/api/alerts`);
  console.log(`✈️  Monitoring: ${SYSTEM_CONFIG.dataCollection.enabled ? 'ENABLED' : 'DISABLED'}`);
});