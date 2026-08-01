declare interface RoutineInput {
  name: string;
  exercises: WorkoutExercise[];
  tags: string[]; // e.g. muscle groups / split labels, as on a workout
  description?: string;
}

declare interface Routine {
  _id: string;
  name: string;
  description: string;
  exercises: WorkoutExercise[];
  tags: string[];
  lastPerformed?: Date;
  user: string;
  createdAt: string;
  updatedAt: string;
}
