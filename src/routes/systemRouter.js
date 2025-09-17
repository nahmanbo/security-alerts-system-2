import { Router } from "express";
import { getHealth, getInfo } from "../controllers/systemController.js";

const router = Router();

// =========================
//   System (מערכת)
// =========================

// Health check / בדיקת בריאות
router.get("/health", getHealth);

// System info / מידע מערכת
router.get("/info", getInfo);

export default router;
