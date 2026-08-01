declare interface Exercise {
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
}

declare interface ExerciseMinimal {
  id: string;
  name: string;
  equipment: string[];
  muscleGroups: string[];
  bodyRegion: string;
}
