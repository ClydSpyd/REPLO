import { Request, Response, NextFunction } from "express";
import { ConversationService } from "./conversation.service";
import { AuthenticatedRequest } from "../../types/auth";

const service = new ConversationService();

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * GET /api/conversation/active?offset=0&limit=10
 * A page of the authenticated user's active conversation, newest-end first.
 */
export async function getActive(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT),
    );
    const page = await service.getPage(authReq.user.id, offset, limit);
    res.json(page);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/conversation/proposals/:proposalId
 * Record a proposal's outcome. Body: { status: "accepted"|"dismissed", routineId? }
 */
export async function updateProposalStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const proposalId = String(req.params.proposalId);
    const { status, routineId } = req.body as {
      status?: string;
      routineId?: string;
    };
    if (status !== "accepted" && status !== "dismissed") {
      return res
        .status(400)
        .json({ error: "status must be 'accepted' or 'dismissed'" });
    }
    const ok = await service.setProposalStatus(
      authReq.user.id,
      proposalId,
      status,
      routineId,
    );
    if (!ok) return res.status(404).json({ error: "proposal not found" });
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
}
