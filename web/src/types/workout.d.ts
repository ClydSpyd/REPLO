const workoutCategories = [
  'upper-body',
  'lower-body',
  'full-body',
  'push',
  'pull',
  'legs',
  'strength',
  'hypertrophy',
  'cardio',
  'conditioning',
  'mobility',
  'core',
  'calisthenics',
  'machines',
  'free-weights',
  'bodyweight',
  'sport',
  'recovery',
] as const;

type WorkoutCategory = (typeof workoutCategories)[number];

declare interface WorkoutSetInput {
  reps: number;
  weight: number;
  completed?: boolean;
}

declare interface WorkoutExercise {
  exerciseId?: string; // slug FK into the exercise catalog; always set by the API
  name: string;
  sets: WorkoutSetInput[];
  exerciseDetails?: Exercise; // muscle groups etc.; absent if the id can't be resolved
}

declare interface SetPayload {
  name: string;
  setData: WorkoutSetInput;
}

declare type BaseWorkout = WorkoutExercise[];

declare interface WorkoutSession {
  _id: string;
  name: string;
  userId: string;
  exercises: WorkoutExercise[];
  started: Date | null;
  ended: Date | null;
  createdAt: string;
  updatedAt: string;
  notes: string;
  tags: string[];
  location?: string;
  baseRoutine?: string;
}
