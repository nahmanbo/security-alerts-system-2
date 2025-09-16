import { Router } from "express";
import { getAircraft, testOpenSky } from "../controllers/aircraftController.js";

const router = Router();

// GET /api/aircraft - get live aircraft data
router.get("/", getAircraft);

// GET /api/aircraft/test - test OpenSky connection
router.get("/test", testOpenSky);

export default router;