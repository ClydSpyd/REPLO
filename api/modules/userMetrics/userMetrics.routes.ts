import { Router } from "express";
import { createMetrics, getLatestMetrics, getMetricsHistory, updateMetrics } from "./userMetrics.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/userMetrics/
 * Auth required. Create a metrics record for the authenticated user.
 * Payload: { weight, bmi, bodyFat, personalBests }
 */
router.post("/", authMiddleware, createMetrics);

/**
 * GET /api/userMetrics/latest
 * Auth required. Get latest metrics for the authenticated user.
 */
router.get("/latest", authMiddleware, getLatestMetrics);

/**
 * GET /api/userMetrics/history
 * Auth required. Get metrics history for the authenticated user.
 */
router.get("/history", authMiddleware, getMetricsHistory);

/**
 * PATCH /api/userMetrics/:id
 * Auth required. Update metrics record by ID.
 * Payload: Partial metrics object
 */
router.patch("/:id", authMiddleware, updateMetrics);

export default router;
