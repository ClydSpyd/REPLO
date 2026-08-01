import { Router } from "express";
import {
  createRoutine,
  getRoutine,
  getAllRoutines,
  getAllRoutinesByUser,
  updateRoutine,
  deleteRoutine,
} from "./routine.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/routine/
 * Public route. List all routines.
 */
router.get("/", getAllRoutines);

/**
 * GET /api/routine/mine
 * Auth required. List all routines created by the authenticated user.
 */
router.get("/mine", authMiddleware, getAllRoutinesByUser);

/**
 * GET /api/routine/:id
 * Public route. Get a routine by its ID.
 */
router.get("/:id", getRoutine);

/**
 * POST /api/routine/
 * Auth required. Create a new routine for the authenticated user.
 * Payload: RoutineInput
 */
router.post("/", authMiddleware, createRoutine);

/** 
 * PATCH /api/routine/:id
 * Auth required. Update an existing routine (e.g. add/remove exercises).
 * Payload: Partial<RoutineInput>
*/
router.patch("/:id", authMiddleware, updateRoutine);

/**
 * DELETE /api/routine/:id
 * Auth required. Delete a routine owned by the authenticated user.
 */
router.delete("/:id", authMiddleware, deleteRoutine);

export default router;
