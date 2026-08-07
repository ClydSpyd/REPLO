/**
 * Derived data for the completed-session review. Volume is `reps × weight` over
 * completed sets only, matching the rest of the app.
 */

/** Compact duration: "45s", "52m", "1h 5m". */
export function formatDurationShort(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

/** Total reps across completed sets. */
export function completedReps(session: WorkoutSession): number {
  let reps = 0;
  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      if (set.completed) reps += set.reps;
    }
  }
  return reps;
}

export interface MuscleVolume {
  /** Raw dataset muscle value, e.g. "upper-chest". */
  muscle: string;
  volume: number;
}

/**
 * Completed volume attributed per muscle. Each exercise's set volume is credited
 * to its primary muscle groups (falling back to its full muscle list when no
 * primary is tagged) — so a bench press counts toward chest, not toward every
 * assisting muscle. Sorted by volume, descending.
 */
export function volumeByMuscle(session: WorkoutSession): MuscleVolume[] {
  const totals = new Map<string, number>();

  for (const exercise of session.exercises) {
    const details = exercise.exerciseDetails;
    const muscles =
      details?.primaryMuscleGroups?.length
        ? details.primaryMuscleGroups
        : (details?.muscleGroups ?? []);
    if (muscles.length === 0) continue;

    const volume = exercise.sets.reduce(
      (sum, set) => (set.completed ? sum + set.reps * set.weight : sum),
      0,
    );
    if (volume <= 0) continue;

    for (const muscle of muscles) {
      totals.set(muscle, (totals.get(muscle) ?? 0) + volume);
    }
  }

  return [...totals.entries()]
    .map(([muscle, volume]) => ({ muscle, volume }))
    .sort((a, b) => b.volume - a.volume);
}

export interface ExerciseSummary {
  /** Total completed volume for the exercise. */
  volume: number;
  /** Index of the heaviest-volume completed set, or -1 if none completed. */
  topSetIndex: number;
  /** The heaviest-volume completed set, if any. */
  topSet: WorkoutSetInput | null;
}

/** Volume + heaviest completed set for one exercise. */
export function summarizeExercise(exercise: WorkoutExercise): ExerciseSummary {
  let volume = 0;
  let topSetIndex = -1;
  let topVolume = -1;

  exercise.sets.forEach((set, i) => {
    if (!set.completed) return;
    const setVolume = set.reps * set.weight;
    volume += setVolume;
    if (setVolume > topVolume) {
      topVolume = setVolume;
      topSetIndex = i;
    }
  });

  return {
    volume,
    topSetIndex,
    topSet: topSetIndex >= 0 ? exercise.sets[topSetIndex] : null,
  };
}

/** "front-delts" → "front delts". */
export function humanizeMuscle(value: string): string {
  return value.replace(/-/g, ' ');
}
