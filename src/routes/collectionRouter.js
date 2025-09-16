import { Router } from "express";
import { 
  getCollectionStatus, 
  startDataCollection, 
  stopDataCollection,
  manualCollect 
} from "../controllers/collectionController.js";

const router = Router();

// GET /api/collection - collection status and stats
router.get("/", getCollectionStatus);

// POST /api/collection/start - start automatic collection
router.post("/start", startDataCollection);

// POST /api/collection/stop - stop automatic collection
router.post("/stop", stopDataCollection);

// POST /api/collection/trigger - trigger manual collection
router.post("/trigger", manualCollect);

export default router;