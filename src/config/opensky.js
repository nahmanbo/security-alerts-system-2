// src/config/opensky.js
export const OPENSKY_CONFIG = {
    baseUrl: "https://opensky-network.org/api/states/all",
    timeout: 15000,
    maxRetries: 3,
    retryDelay: 2000,
    
    // Rate limiting
    rateLimit: {
      requestsPerHour: 400,  // Without auth: 400/hour, With auth: 4000/hour
      requestsPerSecond: 10
    },
    
    // Authentication (optional - increases rate limits)
    auth: {
      enabled: !!process.env.OPENSKY_USERNAME,
      username: process.env.OPENSKY_USERNAME,
      password: process.env.OPENSKY_PASSWORD
    }
  };