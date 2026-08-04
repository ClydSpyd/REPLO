import { Router } from "express";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "./favorite.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/favorite
 * Auth required. List the routine IDs the authenticated user has favorited.
 */
router.get("/", authMiddleware, getFavorites);

/**
 * POST /api/favorite
 * Auth required. Favorite a routine. Payload: { routine }. Idempotent.
 */
router.post("/", authMiddleware, addFavorite);

/**
 * DELETE /api/favorite/:routineId
 * Auth required. Remove the authenticated user's favorite on a routine.
 */
router.delete("/:routineId", authMiddleware, removeFavorite);

export default router;
