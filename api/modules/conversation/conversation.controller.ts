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
