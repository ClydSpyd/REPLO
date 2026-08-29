import { Router } from "express";
import { getActive, updateProposalStatus } from "./conversation.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/conversation/active
 * Auth required. A page of the user's active conversation, newest-end first.
 * Query: offset (default 0), limit (default 10, max 100)
 */
router.get("/active", authMiddleware, getActive);

/**
 * PATCH /api/conversation/proposals/:proposalId
 * Auth required. Record a proposal's outcome (accepted/dismissed).
 */
router.patch("/proposals/:proposalId", authMiddleware, updateProposalStatus);

export default router;
