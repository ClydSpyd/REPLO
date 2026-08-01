import { estimateDurationSec } from '../../hooks/useWorkoutSessionData';

/** Aggregate figures for a routine template. */
export interface RoutineStats {
  exerciseCount: number;
  setCount: number;
  /** Prescribed volume: sum of reps × weight across every set. */
  totalVolume: number;
  /** Rough session length in minutes, using the shared session estimate. */
  estimatedMinutes: number;
}

export function getRoutineStats(routine: Routine): RoutineStats {
  let setCount = 0;
  let totalReps = 0;
  let totalVolume = 0;

  for (const exercise of routine.exercises) {
    for (const set of exercise.sets) {
      setCount += 1;
      totalReps += set.reps;
      totalVolume += set.reps * set.weight;
    }
  }

  const exerciseCount = routine.exercises.length;

  return {
    exerciseCount,
    setCount,
    totalVolume,
    estimatedMinutes: Math.ceil(
      estimateDurationSec({ totalReps, setCount, exerciseCount }) / 60,
    ),
  };
}

/**
 * Build the payload for a copy of an existing routine.
 *
 * Reduced to what the API accepts: `exerciseId` + set prescriptions. Enriched
 * catalog metadata is dropped (it's re-attached on read), and zero-rep sets are
 * filtered out because the API requires reps to be a positive integer.
 */
export function routineToDuplicateInput(routine: Routine): RoutineInput {
  return {
    name: `${routine.name} (Copy)`,
    tags: routine.tags ?? [],
    description: routine.description || undefined,
    exercises: routine.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      sets: exercise.sets
        .filter((set) => set.reps > 0)
        .map((set) => ({ reps: set.reps, weight: set.weight })),
    })) as WorkoutExercise[],
  };
}

/** First few distinct muscle groups the routine's exercises target. */
export function topMuscleGroups(
  exercises: WorkoutExercise[],
  limit = 3,
): string[] {
  const seen = new Set<string>();

  for (const exercise of exercises) {
    const details = exercise.exerciseDetails;
    for (const muscle of details?.primaryMuscleGroups ??
      details?.muscleGroups ??
      []) {
      seen.add(muscle);
      if (seen.size === limit) return [...seen];
    }
  }
  return [...seen];
}

/** Turn a kebab-case value ("front-delts") into a display label ("Front Delts"). */
export function formatLabel(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Lowercase, comma-separated muscle list for an exercise subtitle. */
export function muscleSubtitle(exercise: WorkoutExercise): string {
  return (exercise.exerciseDetails?.muscleGroups ?? [])
    .map((muscle) => muscle.replace(/-/g, ' '))
    .join(', ');
}

/** Compact recency: "2d ago", "2w ago", "Never". */
export function formatLastPerformed(value?: Date | string | null): string {
  if (!value) return 'Never';

  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return 'Never';

  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks}w ago`;

  return `${Math.floor(days / 30)}mo ago`;
}
