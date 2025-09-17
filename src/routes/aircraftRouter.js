import { Router } from "express";
import { getAircraft, testOpenSky } from "../controllers/aircraftController.js";

const router = Router();

// =========================
//   Aircraft (מטוסים)
// =========================

// Get live aircraft data / קבלת נתוני מטוסים חיים
router.get("/", getAircraft);

// Test OpenSky connection / בדיקת חיבור ל־OpenSky
router.get("/test", testOpenSky);

export default router;
