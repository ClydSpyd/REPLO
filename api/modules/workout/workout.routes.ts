import { Router } from "express";
import {
  createWorkout,
  getWorkout,
  getUserWorkouts,
  getActiveSession,
  updateWorkout,
  manageSetPayload,
  handleExercisePayload,
  replaceExercise,
  deleteWorkout,
} from "./workout.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/workout/
 * Create a new workout session (can be partial, e.g. routineId only).
 * Auth required. 
 * Payload: CreateWorkoutPayload
 */
router.post("/", authMiddleware, createWorkout);

/**
 * PATCH /api/workout/:id
 * Incrementally update a workout session (add exercise, update metrics, etc).
 * Auth required. 
 * Payload: Partial<WorkoutSession>
 */
router.patch("/:id", authMiddleware, updateWorkout);

/**
 * POST /api/workout/:id/exercise
 * Add a new exercise to a workout session.
 * Auth required. 
 * Payload: { name: string, sets: WorkoutSetInput[] }
 */
router.post("/:id/exercise", authMiddleware, handleExercisePayload);

/**
 * PATCH /api/workout/:id/exercise/:exerciseName
 * Update an existing exercise in a workout session.
 * Auth required. 
 * Payload: { name: string, sets: WorkoutSetInput[] }
 */
router.patch("/:id/exercise", authMiddleware, handleExercisePayload);

/**
 * DELETE /api/workout/:id/exercise/:exerciseName
 * Delete an exercise from a workout session.
 * Auth required.
 * Payload: None
 */
router.delete(
  "/:id/exercise",
  authMiddleware,
  handleExercisePayload,
);

/**
 * PATCH /api/workout/:id/exercise/replace
 * Replace one exercise with another, preserving the existing sets.
 * Auth required.
 * Payload: { fromExerciseId: string, toExerciseId: string }
 */
router.patch("/:id/exercise/replace", authMiddleware, replaceExercise);

/**
 * POST /api/workout/:id/set
 * Add a new set to an exercise within a workout session.
 * Auth required. 
 * Payload: SetPayload
 */
router.post("/:id/set", authMiddleware, manageSetPayload);

/** 
 *  PATCH /api/workout/:id/set/:idx
 *  Update a specific set within an exercise in a workout session.
 *  Auth required. 
 *  Payload: SetPayload
 */
router.patch("/:id/set/:idx", authMiddleware, manageSetPayload);

/** DELETE /api/workout/:id/set/:idx
 *  Delete a specific set within an exercise in a workout session.
 *  Auth required. 
 *  Payload: None
 */
router.delete("/:id/set/:idx", authMiddleware, manageSetPayload);

/**
 * GET /api/workout/active
 * Get the authenticated user's ongoing workout session, if any.
 * Auth required.
 */
router.get("/active", authMiddleware, getActiveSession);

/**
 * GET /api/workout/mine
 * Get all workouts for the authenticated user.
 * Auth required.
 */
router.get("/mine", authMiddleware, getUserWorkouts);

/**
 * GET /api/workout/:id
 * Get a workout by its ID.
 * Auth required.
 */
router.get("/:id", authMiddleware, getWorkout);

/**
 * DELETE /api/workout/:id
 * Delete a workout session by its ID.
 * Auth required.
 */
router.delete("/:id", authMiddleware, deleteWorkout);


export default router;
