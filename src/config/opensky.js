// src/config/opensky.js
export const OPENSKY_CONFIG = {
  baseUrl: "https://opensky-network.org/api/states/all",
  authUrl: "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token",
  timeout: 15000,
  maxRetries: 3,
  retryDelay: 2000,
  
  // Rate limiting
  rateLimit: {
    requestsPerHour: 400,  // Without auth: 400/hour, With auth: 4000/hour
    requestsPerSecond: 10
  },
  
  // OAuth 2.0 Client Credentials
  auth: {
    enabled: !!process.env.OPENSKY_CLIENT_ID,
    clientId: process.env.OPENSKY_CLIENT_ID,
    clientSecret: process.env.OPENSKY_CLIENT_SECRET
  }
};