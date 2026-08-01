import { WorkoutSetInput } from "../workout/workout.types";

// Types for exercise module
export interface Exercise {
  id: string;
  name: string;
  category: string;
  exerciseType: string;
  equipment: string[];
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  muscleGroups: string[];
  movementPattern: string;
  bodyRegion: string;
  mechanics: string;
  unilateral: boolean;
  bilateral: boolean;
  requiresSpotter: boolean;
  trackableMetrics: string[];
  defaultRepRange: {
    strength?: string;
    hypertrophy?: string;
    endurance?: string;
    [key: string]: string | undefined;
  };
  estimatedCaloriesMET: number;
  aliases: string[];
  tags: string[];
  [key: string]: any;
}

export interface ExerciseInput {
  exerciseId: string; // stable slug FK into the exercise catalog, e.g. "barbell-bench-press"
  sets: WorkoutSetInput[];
}