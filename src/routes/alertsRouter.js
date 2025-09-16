import { Router } from "express";
import { getAlerts, getAlert } from "../controllers/alertsController.js";

const router = Router();

// GET /api/alerts 
router.get("/", getAlerts);

// GET /api/alerts/:id
router.get("/:id", getAlert);

export default router;