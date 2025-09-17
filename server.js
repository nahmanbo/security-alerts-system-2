import "dotenv/config";
import express from "express";
import cors from "cors";

import { logger } from "./src/utils/logger.js";
import { SYSTEM_CONFIG } from "./src/config/system.js";
import { initializeAlertSystem, shutdownAlertSystem } from "./src/services/alertsService.js";
import alertsRouter from "./src/routes/alertsRouter.js";
import systemRouter from "./src/routes/systemRouter.js";
import aircraftRouter from "./src/routes/aircraftRouter.js";
import collectionRouter from "./src/routes/collectionRouter.js";

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
app.use("/api/collection", collectionRouter);

// ================================
// Server Lifecycle Management
// ================================
async function startServer() {
  try {
    // Initialize alert system first
    await initializeAlertSystem();
    console.log('✅ Alert system ready');

    // Start HTTP server
    const server = app.listen(SYSTEM_CONFIG.port, () => {
      console.log(`🛡️ ${SYSTEM_CONFIG.name} v${SYSTEM_CONFIG.version}`);
      console.log(`🌐 Server: http://localhost:${SYSTEM_CONFIG.port}`);
      console.log(`🚨 Alerts: http://localhost:${SYSTEM_CONFIG.port}/api/alerts`);
      console.log(`✈️  Aircraft: http://localhost:${SYSTEM_CONFIG.port}/api/aircraft`);
      console.log(`📊 Collection: http://localhost:${SYSTEM_CONFIG.port}/api/collection`);
      console.log(`🔐 OpenSky Auth: ${process.env.OPENSKY_CLIENT_ID ? 'ENABLED' : 'DISABLED'}`);
      console.log(`🔥 MAXIMUM SENSITIVITY MODE - Detecting ALL changes!`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      
      // Close HTTP server
      server.close(() => {
        console.log('🌐 HTTP server closed');
      });

      // Shutdown alert system
      try {
        await shutdownAlertSystem();
        console.log('✅ Alert system shut down successfully');
      } catch (error) {
        console.error('❌ Alert system shutdown error:', error.message);
      }

      process.exit(0);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('💥 Uncaught Exception:', error);
      await shutdownAlertSystem();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      await shutdownAlertSystem();
      process.exit(1);
    });

    return server;

  } catch (error) {
    console.error('💥 Server startup failed:', error.message);
    process.exit(1);
  }
}

// ================================
// Start Application
// ================================
startServer().catch(error => {
  console.error('💥 Fatal error during startup:', error.message);
  process.exit(1);
});