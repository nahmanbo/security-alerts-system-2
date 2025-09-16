// src/services/aircraftService.js
import { OPENSKY_CONFIG } from "../config/opensky.js";
import { AIRPORT_CONFIG } from "../config/airport.js";

// Cache for access token
let cachedToken = null;
let tokenExpiry = null;

// Get OAuth 2.0 access token
async function getAccessToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch(OPENSKY_CONFIG.authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: OPENSKY_CONFIG.auth.clientId,
        client_secret: OPENSKY_CONFIG.auth.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error(`OAuth error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
    
    return cachedToken;
  } catch (error) {
    console.error(`❌ Failed to get access token: ${error.message}`);
    throw error;
  }
}

// Build OpenSky API URL with bounding box
function buildApiUrl() {
  const bounds = AIRPORT_CONFIG.getBounds();
  const params = new URLSearchParams({
    lamin: bounds.south.toFixed(6),
    lomin: bounds.west.toFixed(6),
    lamax: bounds.north.toFixed(6),
    lomax: bounds.east.toFixed(6)
  });
  return `${OPENSKY_CONFIG.baseUrl}?${params}`;
}

// Build request headers with OAuth token
async function buildHeaders() {
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'BenGurion-SecuritySystem/1.0'
  };

  if (OPENSKY_CONFIG.auth.enabled) {
    try {
      const token = await getAccessToken();
      headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      // Fallback to anonymous access if token fails
    }
  }

  return headers;
}

// Fetch aircraft data from OpenSky with retry logic
async function fetchWithRetry(url, headers, retries = OPENSKY_CONFIG.maxRetries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OPENSKY_CONFIG.timeout);
      
      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`OpenSky API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, OPENSKY_CONFIG.retryDelay));
    }
  }
}

// Convert raw OpenSky data to our format
function convertAircraftData(rawStates, timestamp) {
  if (!rawStates) return [];
  
  return rawStates.map(state => {
    const [
      icao24, callsign, origin_country, time_position, last_contact,
      longitude, latitude, baro_altitude, on_ground, velocity,
      true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source
    ] = state;
    
    return {
      icao24: icao24?.toLowerCase()?.trim(),
      callsign: callsign?.trim() || null,
      originCountry: origin_country || null,
      timestamp,
      lastContact: last_contact ? last_contact * 1000 : timestamp,
      position: {
        latitude,
        longitude,
        altitudeMeters: baro_altitude,
        altitudeFeet: baro_altitude ? Math.round(baro_altitude * 3.28084) : null
      },
      movement: {
        groundSpeedMps: velocity,
        groundSpeedKnots: velocity ? Math.round(velocity * 1.94384) : 0,
        headingDegrees: true_track,
        verticalRateMps: vertical_rate,
        verticalRateFpm: vertical_rate ? Math.round(vertical_rate * 196.85) : 0
      },
      status: {
        onGround: on_ground === true,
        squawkCode: squawk ? parseInt(squawk) : null
      }
    };
  }).filter(aircraft => aircraft.icao24 && aircraft.position.latitude && aircraft.position.longitude);
}

// Main function to get aircraft data
export async function getAircraftData() {
  try {
    const url = buildApiUrl();
    const headers = await buildHeaders();
    const startTime = Date.now();
    
    const data = await fetchWithRetry(url, headers);
    const fetchDuration = Date.now() - startTime;
    const aircraft = convertAircraftData(data.states, (data.time || Math.floor(Date.now() / 1000)) * 1000);
    
    return {
      success: true,
      aircraft,
      count: aircraft.length,
      metadata: {
        fetchDuration,
        apiTimestamp: data.time,
        bounds: AIRPORT_CONFIG.getBounds(),
        authEnabled: OPENSKY_CONFIG.auth.enabled
      }
    };
  } catch (error) {
    console.error(`❌ OpenSky error: ${error.message}`);
    return {
      success: false,
      aircraft: [],
      count: 0,
      error: error.message
    };
  }
}

// Test OpenSky connection
export async function testConnection() {
  try {
    const result = await getAircraftData();
    return {
      success: result.success,
      message: result.success ? 
        `Connected successfully, found ${result.count} aircraft` : 
        `Connection failed: ${result.error}`,
      responseTime: result.metadata?.fetchDuration || null,
      authEnabled: OPENSKY_CONFIG.auth.enabled
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      responseTime: null,
      authEnabled: OPENSKY_CONFIG.auth.enabled
    };
  }
}