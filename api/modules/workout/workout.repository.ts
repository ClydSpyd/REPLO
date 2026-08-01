/**
 * Workout Repository
 * Handles database access for workout sessions using Mongoose models.
 * Methods:
 *   - create: Create a workout session
 *   - findById: Retrieve a workout session by ID
 *   - updateById: Update a workout session by ID
 *   - findByUser: List all workouts for a user
 *   - findByUserAndDate: Find a workout by user and date
 *   - deleteById: Delete a workout session by ID
 */
import { ExerciseInput } from "../exercise/exercise.types";
import { RoutineModel } from "../routine/routine.model";
import { WorkoutModel } from "./workout.model";
import { CreateWorkoutPayload } from "./workout.types";

export class WorkoutRepository {
  /**
   * Create a workout session
   * @param data Workout data
   * @returns Created workout document
   */
  async create(data: CreateWorkoutPayload & { userId: string }) {

    if(data.baseRoutine){
      const baseRoutine = await RoutineModel.findById(data.baseRoutine);
      if (!baseRoutine) {
        throw new Error("Base routine not found");
      }

      // map exercise.set.comlpeted value to false for all sets in the base routine
      data.exercises = baseRoutine.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((set) => ({ ...set, completed: false })),
      })) as ExerciseInput[];

      // Starting a workout from a routine counts as performing it.
      baseRoutine.set("lastPerformed", new Date());
      await baseRoutine.save();
    }

    return await WorkoutModel.create(data);
  }

  async findActiveByUser(userId: string) {
    /**
     * Find the user's ongoing workout, if any.
     * A workout is "ongoing" while it has not been ended.
     * @param userId Authenticated user ID
     * @returns Workout document or null
     */
    return WorkoutModel.findOne({ userId, ended: null }).lean();
  }

  async findById(id: string) {
    /**
     * Retrieve a workout session by ID
     * @param id Workout session ID
     * @returns Workout document
     */
    return WorkoutModel.findById(id).lean();
  }

  async updateById(id: string, data: any) {
    /**
     * Update a workout session by ID
     * @param id Workout session ID
     * @param data Updated workout data
     * @returns Updated workout document
     */
    return WorkoutModel.findByIdAndUpdate(id, data, { new: true });
  }
  async findByUser(userId: string) {
    /**
     * List all workouts for a user
     * @param userId Authenticated user ID
     * @returns Array of workout documents
     */
    return WorkoutModel.find({ userId }).sort({ date: -1 }).lean();
  }

  async findByUserAndDate(userId: string, date: Date) {
    /**
     * Find a workout by user and date
     * @param userId Authenticated user ID
     * @param date Workout date
     * @returns Workout document or null
     */
    return WorkoutModel.findOne({ userId, date });
  }

  async deleteById(id: string) {
    /**
     * Delete a workout session by ID
     * @param id Workout session ID
     * @returns Deleted workout document
     */
    return WorkoutModel.findByIdAndDelete(id);
  }
}
