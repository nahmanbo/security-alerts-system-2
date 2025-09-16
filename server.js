import express from "express";
import cors from "cors";

import { logger } from "./src/utils/logger.js";
import alertsRouter from "./src/routes/alertsRouter.js";
import systemRouter from "./src/routes/systemRouter.js";

const PORT = 3000;
const app = express();

// ================================
// Middleware
// ================================
app.use(express.json());
app.use(cors()); 
app.use(logger);

// ================================
// Routes
// ================================
app.use("/", systemRouter);
app.use("/api/alerts", alertsRouter);

// ================================
// Start Server
// ================================
app.listen(PORT, () => {
  console.log(`🛡️ Ben Gurion Security System listening on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🚨 Alerts API: http://localhost:${PORT}/api/alerts`);
});