import { Router } from "express";
import { getActive } from "./conversation.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/conversation/active
 * Auth required. A page of the user's active conversation, newest-end first.
 * Query: offset (default 0), limit (default 20, max 100)
 */
router.get("/active", authMiddleware, getActive);

export default router;
