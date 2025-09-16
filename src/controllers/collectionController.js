import * as collectionService from "../services/dataCollectionService.js";

// Get collection status and statistics
export function getCollectionStatus(req, res) {
  try {
    const stats = collectionService.getCollectionStats();
    res.json({success: true, collection: stats, timestamp: Date.now()});
  } catch (error) {
    res.status(500).json({success: false, error: error.message, timestamp: Date.now()});
  }
}

// Start automatic data collection
export function startDataCollection(req, res) {
  try {
    const result = collectionService.startCollection();
    const status = result.success ? 200 : 400;
    res.status(status).json({success: result.success, ...result, timestamp: Date.now()});
  } catch (error) {
    res.status(500).json({success: false, error: error.message, timestamp: Date.now()});
  }
}

// Stop automatic data collection
export function stopDataCollection(req, res) {
  try {
    const result = collectionService.stopCollection();
    const status = result.success ? 200 : 400;
    res.status(status).json({success: result.success, ...result, timestamp: Date.now()});
  } catch (error) {
    res.status(500).json({success: false, error: error.message, timestamp: Date.now()});
  }
}

// Trigger manual collection
export async function manualCollect(req, res) {
  try {
    const result = await collectionService.triggerCollection();
    const status = result.success ? 200 : 500;
    res.status(status).json({success: result.success, ...result, timestamp: Date.now()});
  } catch (error) {
    res.status(500).json({success: false, error: error.message, timestamp: Date.now()});
  }
}