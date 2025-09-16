// src/config/system.js
export const SYSTEM_CONFIG = {
    name: "Ben Gurion Security Alerts System",
    version: "1.0.0",
    port: process.env.PORT || 3000,
    
    // Data collection settings
    dataCollection: {
      enabled: true,
      intervalSeconds: 30,
      maxHistoryMinutes: 60
    },
    
    // CORS settings
    cors: {
      enabled: true,
      origins: [
        "http://localhost:3000",
        "http://localhost:8080"
      ]
    },
    
    // Environment
    isDevelopment: process.env.NODE_ENV !== "production",
    isProduction: process.env.NODE_ENV === "production"
  };