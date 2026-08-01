import { Request, Response, NextFunction } from "express";
import { RoutineService } from "./routine.service";
import { AuthenticatedRequest } from "../../types/auth";
import { CreateRoutineSchema } from "./routine.schema";
import z from "zod";

const service = new RoutineService();

/**
 * Creates a new routine for the authenticated user.
 * POST /api/routine/
 */
export async function createRoutine(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = CreateRoutineSchema.safeParse(req.body);
    if (!result.success) {
      // The offending field lives on issue.path, not in the message — keep it
      // in the response so the client isn't left with a contextless error.
      const issues = result.error.issues.map((e: z.core.$ZodIssue) => ({
        field: e.path.join(".") || "(body)",
        message: e.message,
      }));

      issues.forEach(({ field, message }) =>
        console.error(`CREATE_ROUTINE [${field}] ${message}`),
      );

      return res.status(400).json({
        error: `${issues[0].field}: ${issues[0].message}`,
        details: issues,
      });
    }

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const routine = await service.createRoutine(result.data, userId);
    res.status(201).json(routine);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/routine/:id
 * Retrieves a specific routine by its ID.
 */
export async function getRoutine(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const routine = await service.getRoutine(String(req.params.id));
    res.json(routine);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/routine/
 * Retrieves all routines.
 */
export async function getAllRoutines(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const routines = await service.getAllRoutines();
    res.json(routines);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/routine/user
 * Retrieves all routines for the authenticated user.
 */
export async function getAllRoutinesByUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    console.log("Fetching routines for user ID:", userId); // Debug log
    const routines = await service.getAllRoutines(userId);
    res.json(routines);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/routine/:id
 * Deletes a routine owned by the authenticated user.
 */
export async function deleteRoutine(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    await service.deleteRoutine(String(req.params.id), userId);
    res.json({ message: "Routine deleted" });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/routine/:id
 * Updates an existing routine (e.g. add/remove exercises).
 */
export async function updateRoutine(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const routine = await service.updateRoutine(
      String(req.params.id),
      req.body,
      userId,
    );
    res.json(routine);
  } catch (err) {
    next(err);
  }
}
