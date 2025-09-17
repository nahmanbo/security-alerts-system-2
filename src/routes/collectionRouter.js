import { Router } from "express";
import {
  getCollectionStatus,
  startDataCollection,
  stopDataCollection,
  manualCollect
} from "../controllers/collectionController.js";

const router = Router();

// =========================
//   Collection (איסוף נתונים)
// =========================

// Get collection status and stats / קבלת סטטוס וסטטיסטיקות איסוף
router.get("/", getCollectionStatus);

// Start automatic collection / התחלת איסוף אוטומטי
router.post("/start", startDataCollection);

// Stop automatic collection / עצירת איסוף אוטומטי
router.post("/stop", stopDataCollection);

// Trigger manual collection / איסוף ידני
router.post("/trigger", manualCollect);

export default router;
