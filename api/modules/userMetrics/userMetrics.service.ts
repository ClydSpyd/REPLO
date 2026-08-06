import {
  MetricsPeriod,
  MUSCLE_COVERAGE_GROUPS,
  MuscleBalance,
  PersonalBest,
  VolumeAnalysis,
  VolumePoint,
} from "@replo/shared";
import { WorkoutRepository } from "../workout/workout.repository";
import { enrichExercises } from "../exercise/exercise.utils";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Round to one decimal place. */
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Epley estimated one-rep max. */
const estimateOneRepMax = (weight: number, reps: number) =>
  weight * (1 + reps / 30);

/** Best available timestamp to bucket a session by, as epoch ms. */
function sessionTime(workout: any): number {
  const raw = workout.ended ?? workout.started ?? workout.createdAt;
  return new Date(raw).getTime();
}

/** Σ reps × weight over a session's completed sets. */
function sessionVolume(workout: any): number {
  let total = 0;
  for (const exercise of workout.exercises ?? []) {
    for (const set of exercise.sets ?? []) {
      if (set.completed) total += set.reps * set.weight;
    }
  }
  return total;
}

/** Days in the rolling window for a period. `month` is 4 whole weeks. */
const windowDays = (period: MetricsPeriod) => (period === "week" ? 7 : 28);

export class UserMetricsService {
  private workouts = new WorkoutRepository();

  // ---- Computed analytics --------------------------------------------------

  /**
   * Personal bests per exercise across the user's whole history: the heaviest
   * single set and the best estimated 1RM. Only completed sets with positive
   * weight and reps count. Sorted by estimated 1RM, descending.
   */
  async getPersonalBests(userId: string): Promise<PersonalBest[]> {
    const workouts = (await this.workouts.findByUser(userId)) as any[];
    const bests = new Map<string, PersonalBest>();

    for (const workout of workouts) {
      const date = new Date(sessionTime(workout)).toISOString();

      for (const exercise of enrichExercises(workout.exercises ?? [])) {
        if (!exercise.exerciseId) continue;

        for (const set of exercise.sets) {
          if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;

          const oneRm = estimateOneRepMax(set.weight, set.reps);
          const current = bests.get(exercise.exerciseId);

          if (!current) {
            bests.set(exercise.exerciseId, {
              exerciseId: exercise.exerciseId,
              name: exercise.name || exercise.exerciseId,
              heaviestWeight: { weight: set.weight, reps: set.reps, date },
              estimatedOneRepMax: {
                value: round1(oneRm),
                weight: set.weight,
                reps: set.reps,
                date,
              },
            });
            continue;
          }

          if (set.weight > current.heaviestWeight.weight) {
            current.heaviestWeight = { weight: set.weight, reps: set.reps, date };
          }
          if (oneRm > current.estimatedOneRepMax.value) {
            current.estimatedOneRepMax = {
              value: round1(oneRm),
              weight: set.weight,
              reps: set.reps,
              date,
            };
          }
        }
      }
    }

    return [...bests.values()].sort(
      (a, b) => b.estimatedOneRepMax.value - a.estimatedOneRepMax.value,
    );
  }

  /**
   * Completed volume over the rolling window, bucketed into a series (daily for
   * `week`, weekly for `month`), with the window total and % change vs the
   * immediately preceding window of equal length.
   */
  async getVolume(
    userId: string,
    period: MetricsPeriod,
  ): Promise<VolumeAnalysis> {
    const workouts = (await this.workouts.findByUser(userId)) as any[];

    const now = Date.now();
    const days = windowDays(period);
    const bucketDays = period === "week" ? 1 : 7;
    const bucketCount = days / bucketDays;
    const windowMs = days * DAY_MS;
    const start = now - windowMs;
    const prevStart = now - 2 * windowMs;

    const series: VolumePoint[] = Array.from({ length: bucketCount }, (_, i) => ({
      bucket: new Date(start + i * bucketDays * DAY_MS).toISOString(),
      volume: 0,
    }));

    let total = 0;
    let prevTotal = 0;

    for (const workout of workouts) {
      const time = sessionTime(workout);
      const volume = sessionVolume(workout);
      if (volume <= 0) continue;

      if (time >= start && time < now) {
        total += volume;
        const index = Math.min(
          bucketCount - 1,
          Math.floor((time - start) / (bucketDays * DAY_MS)),
        );
        if (index >= 0) series[index].volume += volume;
      } else if (time >= prevStart && time < start) {
        prevTotal += volume;
      }
    }

    series.forEach((point) => (point.volume = round1(point.volume)));

    return {
      period,
      total: round1(total),
      deltaPct:
        prevTotal > 0 ? round1(((total - prevTotal) / prevTotal) * 100) : null,
      series,
    };
  }

  /**
   * Muscle balance over the rolling window: completed volume attributed to each
   * of the 6 coverage groups an exercise's muscles hit (a set counts toward
   * every group it matches — a "share of attention" measure), plus each group's
   * percentage of the summed group volume.
   */
  async getMuscleBalance(
    userId: string,
    period: MetricsPeriod,
  ): Promise<MuscleBalance> {
    const workouts = (await this.workouts.findByUser(userId)) as any[];

    const now = Date.now();
    const start = now - windowDays(period) * DAY_MS;
    const totals = new Map<string, number>(
      MUSCLE_COVERAGE_GROUPS.map((group) => [group.label, 0]),
    );

    for (const workout of workouts) {
      const time = sessionTime(workout);
      if (time < start || time >= now) continue;

      for (const exercise of enrichExercises(workout.exercises ?? [])) {
        const details = exercise.exerciseDetails;
        if (!details) continue;

        const hit = new Set<string>([
          ...(details.muscleGroups ?? []),
          ...(details.primaryMuscleGroups ?? []),
          ...(details.secondaryMuscleGroups ?? []),
        ]);

        const volume = exercise.sets.reduce(
          (sum, set) => (set.completed ? sum + set.reps * set.weight : sum),
          0,
        );
        if (volume <= 0) continue;

        for (const group of MUSCLE_COVERAGE_GROUPS) {
          if (group.match.some((muscle) => hit.has(muscle))) {
            totals.set(group.label, (totals.get(group.label) ?? 0) + volume);
          }
        }
      }
    }

    const sum = [...totals.values()].reduce((a, b) => a + b, 0);

    return {
      period,
      groups: MUSCLE_COVERAGE_GROUPS.map((group) => {
        const volume = totals.get(group.label) ?? 0;
        return {
          label: group.label,
          volume: round1(volume),
          percent: sum > 0 ? round1((volume / sum) * 100) : 0,
        };
      }),
    };
  }
}
