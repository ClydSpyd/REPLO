import { ExerciseInput } from "../exercise/exercise.types";

export interface RoutineInput {
  name: string;
  exercises: ExerciseInput[];
  tags: string[]; // e.g. muscle groups / split labels, as on a workout
  description?: string;
}

export interface Routine extends RoutineInput {
  _id: string;
  user: string;
  createdAt: Date;
  updatedAt: Date;
  /** When a workout was last started from this routine; null if never. */
  lastPerformed?: Date | null;
}
