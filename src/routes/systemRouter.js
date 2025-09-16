import { Router } from "express";
import { getHealth, getInfo } from "../controllers/systemController.js";

const router = Router();

// GET /health - system health check
router.get("/health", getHealth);

// GET /info - system information  
router.get("/info", getInfo);

export default router;