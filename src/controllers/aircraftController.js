import * as aircraftService from "../services/aircraftService.js";

// Get live aircraft data from OpenSky
export async function getAircraft(req, res) {
  try {
    const result = await aircraftService.getAircraftData();
    res.json({success: result.success, ...result, timestamp: Date.now()});
  } catch (error) {
    res.status(500).json({success: false, error: error.message, timestamp: Date.now()});
  }
}

// Test OpenSky connection
export async function testOpenSky(req, res) {
  try {
    const result = await aircraftService.testConnection();
    res.json({success: result.success, connection: result, timestamp: Date.now()});
  } catch (error) {
    res.status(500).json({success: false, error: error.message, timestamp: Date.now()});
  }
}