/**
 * Workout Controller
 * Handles HTTP request/response logic for workout session creation, incremental updates, retrieval, and listing.
 * Functions:
 *   - createWorkout: POST handler for new workout session
 *   - updateWorkout: PATCH handler for incremental updates
 *   - getWorkout: GET handler for retrieving a workout session
 *   - getUserWorkouts: GET handler for listing all workouts for a user
 */
import { Request, Response, NextFunction } from "express";
import { WorkoutService } from "./workout.service";
import { AuthenticatedRequest } from "../../types/auth";

const service = new WorkoutService();

export async function createWorkout(
  /**
   * POST /api/workout/
   * Create a new workout session (can be partial, e.g. routineId only).
   * Payload: { baseRoutine, date, notes, exercises }
   */
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const workout = await service.createWorkout(req.body, userId);
    res.status(201).json(workout);
  } catch (err) {
    next(err);
  }
}
export async function updateWorkout(
  /**
   * PATCH /api/workout/:id
   * Incrementally update a workout session (add exercises, notes, metrics).
   * Payload: Partial createWorkout
   */
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const workout = await service.updateWorkout(String(req.params.id), req.body, userId);
    res.json(workout);
  } catch (err) {
    next(err);
  }
}

export async function manageSetPayload(
  /**
   * POST /api/workout/:id/set
   * Add a new set to an exercise within a workout session.
   * Payload: { exerciseId, setData }
   * 
   * PATCH /api/workout/:id/set/:idx
   * Update a specific set within an exercise in a workout session.
   * Payload: { exerciseId, setData }
   * 
   * DELETE /api/workout/:id/set/:idx
   * Delete a specific set within an exercise in a workout session.
   * Payload: { setData: {name: string} }
   */
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const updateIdx = req.params.idx ? parseInt(String(req.params.idx)) : undefined;

    const workout = await service.manageSetPayload(
      String(req.params.id),
      req.body,
      userId,
      req.method === "DELETE",
      updateIdx
    );
    res.json(workout);
  } catch (err) {
    next(err);
  }
}

export async function handleExercisePayload(
  /**
   * POST /api/workout/:id/exercise
   * Add a new exercise to a workout session.
   * Payload: { name: string, sets: WorkoutSetInput[] }
   * 
   * PATCH /api/workout/:id/exercise/:exerciseName
   * Update an existing exercise in a workout session.
   * Payload: { name: string, sets: WorkoutSetInput[] }
   * 
   * DELETE /api/workout/:id/exercise/:exerciseName
   * Delete an exercise from a workout session.
   * Payload: None
   */
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const deleteExercise = req.method === "DELETE";
    const workout = await service.handleExercisePayload(
      String(req.params.id),
      req.body,
      userId,
      req.method
    );
    res.json(workout);
  } catch (err) {
    next(err);
  }
}

export async function replaceExercise(
  /**
   * PATCH /api/workout/:id/exercise/replace
   * Replace one exercise with another, preserving the existing sets.
   * Payload: { fromExerciseId: string, toExerciseId: string }
   */
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const workout = await service.replaceExercise(
      String(req.params.id),
      req.body,
      userId
    );
    res.json(workout);
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkout(
  /**
   * DELETE /api/workout/:id
   * Delete a workout session by its unique ID.
   */
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    await service.deleteWorkout(String(req.params.id), userId);
    res.json({ message: "Workout deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getWorkout(
  /**
   * GET /api/workout/:id
   * Retrieve a workout session by its unique ID.
   */
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const workout = await service.getWorkout(String(req.params.id), userId);
    res.json(workout);
  } catch (err) {
    next(err);
  }
}

export async function getActiveSession(
  /**
   * GET /api/workout/active
   * Retrieve the authenticated user's ongoing workout session, if any.
   */
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const workout = await service.getActiveSession(userId);
    res.json(workout);
  } catch (err) {
    next(err);
  }
}

export async function getUserWorkouts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    if(!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const workouts = await service.getUserWorkouts(userId);
    res.json(workouts);
  } catch (err) {
    next(err);
  }
}
