import { Router } from "express";
import {
  getPersonalBests,
  getVolume,
  getVolumeTrend,
  getMuscleBalance,
} from "./userMetrics.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/userMetrics/personal-bests
 * Auth required. Personal bests (heaviest weight + estimated 1RM) per exercise,
 * computed from the user's whole workout history.
 */
router.get("/personal-bests", authMiddleware, getPersonalBests);

/**
 * GET /api/userMetrics/volume?period=week|month
 * Auth required. Completed-volume series + total + trend over the window.
 */
router.get("/volume", authMiddleware, getVolume);

/**
 * GET /api/userMetrics/volume-trend
 * Auth required. Last 8 weeks (bars) + last 28 days (strip) of completed volume.
 */
router.get("/volume-trend", authMiddleware, getVolumeTrend);

/**
 * GET /api/userMetrics/muscle-balance?period=week|month
 * Auth required. Volume attributed to each coverage group over the window.
 */
router.get("/muscle-balance", authMiddleware, getMuscleBalance);

export default router;
