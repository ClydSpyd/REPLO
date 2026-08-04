import { Request, Response, NextFunction } from "express";
import { FavoriteService } from "./favorite.service";
import { AuthenticatedRequest } from "../../types/auth";
import { CreateFavoriteSchema } from "./favorite.schema";
import z from "zod";

const service = new FavoriteService();

/**
 * GET /api/favorite
 * Lists the routine IDs the authenticated user has favorited.
 */
export async function getFavorites(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const routineIds = await service.getFavoriteRoutineIds(userId);
    res.json(routineIds);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/favorite
 * Favorites a routine for the authenticated user. Payload: { routine }.
 */
export async function addFavorite(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = CreateFavoriteSchema.safeParse(req.body);
    if (!result.success) {
      // The offending field lives on issue.path, not in the message — keep it
      // in the response so the client isn't left with a contextless error.
      const issues = result.error.issues.map((e: z.core.$ZodIssue) => ({
        field: e.path.join(".") || "(body)",
        message: e.message,
      }));

      return res.status(400).json({
        error: `${issues[0].field}: ${issues[0].message}`,
        details: issues,
      });
    }

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    await service.addFavorite(result.data.routine, userId);
    res.status(201).json({ routine: result.data.routine });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/favorite/:routineId
 * Removes the authenticated user's favorite marking on a routine.
 */
export async function removeFavorite(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    await service.removeFavorite(String(req.params.routineId), userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
