import { ExerciseInput } from "../exercise/exercise.types";

export interface WorkoutSetInput {
  reps: number;
  weight: number;
  completed?: boolean; // optional, defaults to false
}

export interface SetPayload {
  name: string;
  exerciseId?: string; // optional; entries are matched by name for backward compatibility
  setData: WorkoutSetInput;
}

export interface ReplaceExercisePayload {
  fromExerciseId: string; // exercise currently in the workout
  toExerciseId: string; // exercise to swap it for (sets are preserved)
}

export interface CreateWorkoutPayload {
  name?: string; // optional, defaults to "Untitled Workout"
  exercises: ExerciseInput[]; // Can be added incrementally
  notes?: string;
  location?: string;
  baseRoutine?: string; // ID of the routine this workout is based on, if any
  started?: Date; // stamped server-side when the session begins (create time)
  date?: Date; // defaults to now
}

export interface WorkoutSession {
  _id: string;
  name: string;
  userId: string;
  exercises: ExerciseInput[];
  started: Date | null;
  ended: Date | null;
  createdAt: Date;
  updatedAt: Date;
  baseRoutine?: string; // original routine ID, if created from a routine
  notes?: string;
  location?: string;
}