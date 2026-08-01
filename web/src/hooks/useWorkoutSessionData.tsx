import { useMemo } from 'react';

/**
 * Data derived from a workout session. Every field is `null` when no session is
 * provided, so consumers can render placeholders without extra null-checks.
 */
export interface WorkoutSessionData {
  /** Number of exercises in the session. */
  exerciseCount: number | null;
  /** Total number of sets across all exercises. */
  setCount: number | null;
  /** Number of sets marked completed. */
  completedSetCount: number | null;
  /** Total volume (reps × weight) across all sets. */
  totalVolume: number | null;
  /** Volume from completed sets only. */
  completedVolume: number | null;
  /** Completion as a 0–1 fraction of sets logged (null when there are no sets). */
  progress: number | null;
  /** Rough estimated duration of the session, in seconds (see estimation constants). */
  estimatedDurationSec: number | null;
}

// Tunable constants for the duration estimate.
const SECONDS_PER_REP = 3; // tempo of a single rep
const REST_BETWEEN_SETS_SEC = 90; // rest taken after each set
const EXERCISE_TRANSITION_SEC = 120; // setup / equipment change per exercise

/**
 * Rough session length: time under load + rest between sets + transitions
 * between exercises. Shared by sessions and routine templates so both quote
 * the same number.
 */
export function estimateDurationSec({
  totalReps,
  setCount,
  exerciseCount,
}: {
  totalReps: number;
  setCount: number;
  exerciseCount: number;
}): number {
  return (
    totalReps * SECONDS_PER_REP +
    setCount * REST_BETWEEN_SETS_SEC +
    exerciseCount * EXERCISE_TRANSITION_SEC
  );
}

const EMPTY_DATA: WorkoutSessionData = {
  exerciseCount: null,
  setCount: null,
  completedSetCount: null,
  totalVolume: null,
  completedVolume: null,
  progress: null,
  estimatedDurationSec: null,
};

/**
 * Derive summary stats from a workout session.
 *
 * @param session - The session to summarise, or `null` when none is available.
 * @returns Derived counts and volumes, or all-`null` defaults when `session` is null.
 */
export function useWorkoutSessionData(
  session: WorkoutSession | null,
): WorkoutSessionData {
  return useMemo(() => {
    if (!session) return EMPTY_DATA;

    let setCount = 0;
    let completedSetCount = 0;
    let totalVolume = 0;
    let completedVolume = 0;
    let totalReps = 0;

    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        const volume = set.reps * set.weight;
        setCount += 1;
        totalReps += set.reps;
        totalVolume += volume;
        if (set.completed) {
          completedSetCount += 1;
          completedVolume += volume;
        }
      }
    }

    const exerciseCount = session.exercises.length;

    const estimatedDurationSec = estimateDurationSec({
      totalReps,
      setCount,
      exerciseCount,
    });

    return {
      exerciseCount,
      setCount,
      completedSetCount,
      totalVolume,
      completedVolume,
      progress: setCount > 0 ? completedSetCount / setCount : null,
      estimatedDurationSec,
    };
  }, [session]);
}
