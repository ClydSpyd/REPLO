import { Types } from "mongoose";
import { WorkoutRepository } from "./workout.repository";
import {
  CreateWorkoutPayload,
  ReplaceExercisePayload,
  SetPayload,
  WorkoutSession,
} from "./workout.types";
import { exerciseExists, withEnrichedExercises } from "../exercise/exercise.utils";
import { ExerciseInput } from "../exercise/exercise.types";

export class WorkoutService {
  private repository = new WorkoutRepository();

  private assertValidWorkoutId(workoutId: string) {
    if (!Types.ObjectId.isValid(workoutId)) {
      const error = new Error("Invalid workout ID format") as Error & {
        status?: number;
      };
      error.status = 400;
      throw error;
    }
  }

  /** Validate the id, load the workout, and assert the user owns it. */
  private async loadOwnedWorkout(workoutId: string, userId: string) {
    this.assertValidWorkoutId(workoutId);

    const workout = await this.repository.findById(workoutId);
    if (!workout) throw new Error("Workout not found");
    if (workout.userId.toString() !== userId) {
      throw new Error("You do not have permission to access this workout");
    }
    return workout;
  }

  async createWorkout(data: CreateWorkoutPayload, userId: string) {
    if (!userId) {
      throw new Error("User ID is required to log a workout");
    }

    if (data.baseRoutine && !Types.ObjectId.isValid(data.baseRoutine)) {
      throw new Error("Invalid routine baseID");
    }

    const ongoing = await this.repository.findActiveByUser(userId);
    if (ongoing) {
      const error = new Error(
        "You already have an ongoing workout. Finish it before starting a new one.",
      ) as Error & { status?: number };
      error.status = 409;
      throw error;
    }

    return this.repository.create({ ...data, started: new Date(), userId });
  }

  async updateWorkout(
    workoutId: string,
    updates: Partial<WorkoutSession>,
    userId: string,
  ) {
    const workout = await this.loadOwnedWorkout(workoutId, userId);

    // merge updates into workout
    Object.assign(workout, updates);
    const updated = await this.repository.updateById(workoutId, workout);
    if (!updated) {
      throw new Error("Workout not found");
    }
    return withEnrichedExercises(updated);
  }

  async manageSetPayload(
    workoutId: string,
    setPayload: SetPayload,
    userId: string,
    deleteSet: boolean,
    setIdx?: number, // optional index for updating an existing set
  ) {
    const workout = await this.loadOwnedWorkout(workoutId, userId);

    const exercise = workout.exercises.find(
      (ex) => ex.exerciseId === setPayload.exerciseId,
    );

    if (deleteSet) {
      if (setIdx === undefined) {
        throw new Error("Set index is required for deleting a set");
      }
      if (!exercise) {
        throw new Error("Exercise not found in workout");
      }
      if (setIdx < 0 || setIdx >= exercise.sets.length) {
        throw new Error("Set index out of bounds");
      }
      exercise.sets.splice(setIdx, 1); // remove the set at setIdx
    } else if (exercise) {
      if (
        typeof setIdx !== "undefined" &&
        setIdx >= 0 &&
        setIdx < exercise.sets.length
      ) {
        // Support both lean plain objects and mongoose-typed nested docs
        Object.assign(exercise.sets[setIdx], setPayload.setData);
      } else {
        // existing workout, new set - push to sets
        exercise.sets.push(setPayload.setData);
      }
    } else {
      //throw error if trying to update a set for an exercise that doesn't exist in the workout
      throw new Error("Exercise not found in workout");
    }

    const updated = await this.repository.updateById(workoutId, workout);
    if (!updated) {
      throw new Error("Workout not found");
    }
    return withEnrichedExercises(updated);
  }

  async handleExercisePayload(
    workoutId: string,
    exercisePayload: ExerciseInput,
    userId: string,
    method: string,
  ) {
    const workout = await this.loadOwnedWorkout(workoutId, userId);

    const existingExerciseIndex = workout.exercises.findIndex(
      (ex) => ex.exerciseId === exercisePayload.exerciseId,
    );

    if (method === "DELETE") {
      //DELETE exercise at existingExerciseIndex
      if (existingExerciseIndex === -1) {
        throw new Error("Exercise not found in workout");
      }
      workout.exercises.splice(existingExerciseIndex, 1);
    } else if (method === "PATCH") {
      // PATCH exercise already exists in workout, update
      if (existingExerciseIndex === -1) {
        throw new Error("Exercise not found in workout");
      }
      Object.assign(workout.exercises[existingExerciseIndex], exercisePayload);
    } else if (method === "POST") {
      // POST new exercise, push to exercises
      if (existingExerciseIndex !== -1) {
        throw new Error(
          "Exercise already exists in workout, cannot add duplicate",
        );
      }
      workout.exercises.push(exercisePayload);
    }

    const updated = await this.repository.updateById(workoutId, workout);
    if (!updated) {
      throw new Error("Workout not found");
    }
    return withEnrichedExercises(updated);
  }

  /**
   * Replace one exercise in a workout with another, keeping the existing sets
   * intact. Only the exercise identity (`exerciseId`) changes.
   */
  async replaceExercise(
    workoutId: string,
    payload: ReplaceExercisePayload,
    userId: string,
  ) {
    const { fromExerciseId, toExerciseId } = payload;
    console.log(`Replacing exercise ${fromExerciseId} with ${toExerciseId} in workout ${workoutId}`);

    if (!fromExerciseId || !toExerciseId) {
      const error = new Error(
        "Both fromExerciseId and toExerciseId are required",
      ) as Error & { status?: number };
      error.status = 400;
      throw error;
    }

    if (!exerciseExists(toExerciseId)) {
      const error = new Error(
        "Replacement exercise does not exist in the catalog",
      ) as Error & { status?: number };
      error.status = 400;
      throw error;
    }

    const workout = await this.loadOwnedWorkout(workoutId, userId);

    console.log(`Loaded workout: ${JSON.stringify(workout)}`);
    const index = workout.exercises.findIndex(
      (ex) => ex.exerciseId === fromExerciseId,
    );
    if (index === -1) {
      throw new Error("Exercise not found in workout");
    }

    // Guard against collapsing two entries into a duplicate exerciseId
    const clashesWithOther = workout.exercises.some(
      (ex, i) => i !== index && ex.exerciseId === toExerciseId,
    );
    if (clashesWithOther) {
      const error = new Error(
        "That exercise is already in the workout",
      ) as Error & { status?: number };
      error.status = 409;
      throw error;
    }

    // Swap identity only; the sets on this entry are left untouched
    workout.exercises[index].exerciseId = toExerciseId;

    const updated = await this.repository.updateById(workoutId, workout);
    if (!updated) {
      throw new Error("Workout not found");
    }
    return withEnrichedExercises(updated);
  }

  async getWorkout(workoutId: string, userId: string) {
    const workout = await this.loadOwnedWorkout(workoutId, userId);
    return withEnrichedExercises(workout);
  }

  async getActiveSession(userId: string) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const workout = await this.repository.findActiveByUser(userId);
    if (!workout) return null;

    return withEnrichedExercises(workout);
  }

  async getUserWorkouts(userId: string) {
    const workouts = await this.repository.findByUser(userId);
    return workouts.map(withEnrichedExercises);
  }

  async deleteWorkout(id: string, userId: string) {
    // Ownership is enforced before deletion
    await this.loadOwnedWorkout(id, userId);

    return this.repository.deleteById(id);
  }
}
