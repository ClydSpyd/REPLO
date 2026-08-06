/**
 * Shared contracts for the UserMetrics analytics endpoints, consumed by both
 * the API (which computes them from workout history) and the web client.
 */

export type MetricsPeriod = 'week' | 'month';

/** A single logged set that set a record, with the session date it happened. */
export interface PersonalBestSet {
  weight: number;
  reps: number;
  /** ISO date of the session the set belongs to. */
  date: string;
}

export interface OneRepMaxRecord extends PersonalBestSet {
  /** Estimated one-rep max (Epley): weight × (1 + reps / 30). */
  value: number;
}

/** Best performance for one exercise across the user's whole history. */
export interface PersonalBest {
  exerciseId: string;
  name: string;
  /** Heaviest single set (by weight). */
  heaviestWeight: PersonalBestSet;
  /** Best estimated 1RM across all sets. */
  estimatedOneRepMax: OneRepMaxRecord;
}

export interface VolumePoint {
  /** ISO date marking the start of the bucket (a day for `week`, a week for `month`). */
  bucket: string;
  /** Σ reps × weight of completed sets in the bucket. */
  volume: number;
}

export interface VolumeAnalysis {
  period: MetricsPeriod;
  /** Total completed volume over the window. */
  total: number;
  /** % change vs the immediately preceding equal-length window; null if that window had no volume. */
  deltaPct: number | null;
  series: VolumePoint[];
}

export interface MuscleBalanceGroup {
  label: string;
  /** Completed volume attributed to this coverage group over the window. */
  volume: number;
  /** Share of the summed group volume (0–100). */
  percent: number;
}

export interface MuscleBalance {
  period: MetricsPeriod;
  groups: MuscleBalanceGroup[];
}

/** A coverage bucket and the dataset muscle values that map into it. */
export interface MuscleCoverageGroup {
  label: string;
  match: string[];
}

/**
 * The 6 broad coverage buckets used for muscle-balance, ported from the web
 * client's `coverageGroups` (src/config/muscles.ts) so the API can bucket
 * server-side. Kept in sync manually for now; the web copy can later import this.
 */
export const MUSCLE_COVERAGE_GROUPS: MuscleCoverageGroup[] = [
  { label: 'Chest', match: ['chest', 'upper-chest', 'lower-chest'] },
  {
    label: 'Back',
    match: [
      'back',
      'lats',
      'upper-back',
      'middle-back',
      'lower-back',
      'traps',
      'upper-traps',
      'teres-major',
      'rotator-cuff',
    ],
  },
  {
    label: 'Shoulders',
    match: ['shoulders', 'front-delts', 'side-delts', 'rear-delts', 'rotator-cuff'],
  },
  { label: 'Arms', match: ['biceps', 'brachialis', 'triceps', 'forearms'] },
  {
    label: 'Legs',
    match: [
      'glutes',
      'glute-medius',
      'quadriceps',
      'quads',
      'hamstrings',
      'calves',
      'adductors',
      'abductors',
      'hip-flexors',
    ],
  },
  { label: 'Core', match: ['core', 'abs', 'obliques'] },
];
