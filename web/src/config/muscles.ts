// All muscle groups referenced across the exercise dataset (primary + secondary, deduped)
export const muscleGroups = [
  'abductors',
  'abs',
  'adductors',
  'biceps',
  'brachialis',
  'calves',
  'chest',
  'core',
  'forearms',
  'front-delts',
  'full-body',
  'glute-medius',
  'glutes',
  'hamstrings',
  'hip-flexors',
  'lats',
  'lower-back',
  'lower-chest',
  'middle-back',
  'obliques',
  'quadriceps',
  'rear-delts',
  'rotator-cuff',
  'shoulders',
  'side-delts',
  'teres-major',
  'traps',
  'triceps',
  'upper-back',
  'upper-chest',
  'upper-traps',
];

export type MuscleGroup = (typeof muscleGroups)[number];

// Consolidated, general-use muscle groups (sub-groups like front/side/rear-delts,
// upper/lower-chest, and back sub-regions rolled up into their parent group)
export const primaryMuscleGroups = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'glutes',
  'quadriceps',
  'hamstrings',
  'calves',
  'full-body',
  'upper-body',
  'lower-body',
  'core',
];

export type PrimaryMuscleGroup = (typeof primaryMuscleGroups)[number];

// General tags for labeling a workout (e.g. by split or body region)
export const tags = [
  'push',
  'pull',
  'legs',
  'upper-body',
  'lower-body',
  'full-body',
  'chest',
  'back',
  'core',
];

export const equipment = [
  'ab-crunch-machine',
  'ab-wheel',
  'ankle-strap',
  'assisted-pull-up-machine',
  'back-extension-bench',
  'bar',
  'barbell',
  'battle-ropes',
  'bench',
  'box',
  'cable-machine',
  'calf-raise-machine',
  'chest-press-machine',
  'decline-bench',
  'dip-bars',
  'dumbbell',
  'dumbbells',
  'ez-bar',
  'hack-squat-machine',
  'hip-abductor-machine',
  'hip-adductor-machine',
  'incline-bench',
  'kettlebell',
  'kettlebells',
  'landmine-attachment',
  'lat-pulldown-machine',
  'lateral-raise-machine',
  'leg-curl-machine',
  'leg-extension-machine',
  'leg-press-machine',
  'mat',
  'medicine-ball',
  'pec-deck-machine',
  'plate',
  'preacher-bench',
  'pull-up-bar',
  'rings',
  'rope',
  'row-machine',
  'seated-calf-raise-machine',
  'shoulder-press-machine',
  'sled',
  'smith-machine',
  'squat-rack',
  't-bar',
  'trap-bar',
  'wall',
];

export type Equipment = (typeof equipment)[number];

/**
 * Coarse equipment buckets offered as filters. Each `match` is tested as a
 * substring against the dataset's own equipment values, so "cable" catches
 * "cable-machine" and "dumbbell" catches "dumbbells".
 */
export const equipmentFilters = [
  { label: 'Barbell', match: ['barbell', 'ez-bar', 't-bar', 'trap-bar'] },
  { label: 'Dumbbell', match: ['dumbbell', 'kettlebell'] },
  { label: 'Cable', match: ['cable', 'rope', 'lat-pulldown'] },
  { label: 'Machine', match: ['machine', 'smith', 'sled'] },
  {
    label: 'Bodyweight',
    match: ['bodyweight', 'pull-up-bar', 'dip-bars', 'rings', 'mat', 'wall'],
  },
] as const;

export type EquipmentFilter = (typeof equipmentFilters)[number]['label'];

/**
 * Canonical expansion of each consolidated group into the specific muscle
 * values the exercise dataset actually uses.
 *
 * This is the single source of truth for muscle matching: picking "Back" must
 * also surface exercises tagged `upper-back`, `lower-back`, `lats`, `traps`,
 * and so on — the dataset never tags anything as plain `back`.
 */
export const muscleGroupAliases: Record<PrimaryMuscleGroup, string[]> = {
  chest: ['chest', 'upper-chest', 'lower-chest'],
  back: [
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
  shoulders: [
    'shoulders',
    'front-delts',
    'side-delts',
    'rear-delts',
    'rotator-cuff',
  ],
  biceps: ['biceps', 'brachialis'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  glutes: ['glutes', 'glute-medius'],
  quadriceps: ['quadriceps', 'quads'],
  hamstrings: ['hamstrings'],
  calves: ['calves'],
  core: ['core', 'abs', 'obliques'],
  'full-body': ['full-body'],
  'upper-body': [
    'chest',
    'upper-chest',
    'lower-chest',
    'back',
    'lats',
    'upper-back',
    'middle-back',
    'lower-back',
    'traps',
    'upper-traps',
    'teres-major',
    'rotator-cuff',
    'shoulders',
    'front-delts',
    'side-delts',
    'rear-delts',
    'biceps',
    'brachialis',
    'triceps',
    'forearms',
  ],
  'lower-body': [
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
};

/** Every dataset muscle value a consolidated group should match. */
export function expandMuscleGroup(group: string): string[] {
  const key = group.trim().toLowerCase();
  return muscleGroupAliases[key] ?? [key];
}

/**
 * Does an exercise belong to a consolidated group? Checks its muscle groups
 * against the group's aliases, falling back to `bodyRegion` for the
 * whole-region groups (upper-body / lower-body / full-body).
 */
export function matchesMuscleGroup(
  exercise: { muscleGroups?: string[]; bodyRegion?: string | boolean },
  group: string,
): boolean {
  const aliases = new Set(expandMuscleGroup(group));
  const hasMuscle = (exercise.muscleGroups ?? []).some((muscle) =>
    aliases.has(muscle.trim().toLowerCase()),
  );
  const matchesRegion =
    String(exercise.bodyRegion ?? '').toLowerCase() ===
    group.trim().toLowerCase();

  return hasMuscle || matchesRegion;
}

/**
 * Broad coverage buckets shown as pills. Derived from the alias map above so
 * the pills and the filters can never disagree about what counts as "Back".
 */
export const coverageGroups: { label: string; match: string[] }[] = [
  { label: 'Chest', match: muscleGroupAliases.chest },
  { label: 'Back', match: muscleGroupAliases.back },
  { label: 'Shoulders', match: muscleGroupAliases.shoulders },
  {
    label: 'Arms',
    match: [
      ...muscleGroupAliases.biceps,
      ...muscleGroupAliases.triceps,
      ...muscleGroupAliases.forearms,
    ],
  },
  { label: 'Legs', match: muscleGroupAliases['lower-body'] },
  { label: 'Core', match: muscleGroupAliases.core },
];

/** Split labels offered when tagging a routine. Single-select. */
export const routineTags = [
  'push',
  'pull',
  'legs',
  'core',
  'upper',
  'full-body',
] as const;

export type RoutineTag = (typeof routineTags)[number];

export const movementPattern = [
  'anti-extension',
  'anti-lateral-flexion',
  'anti-rotation',
  'chest-adduction',
  'conditioning',
  'elbow-extension',
  'elbow-flexion',
  'full-body',
  'hinge',
  'hip-abduction',
  'hip-adduction',
  'hip-extension',
  'horizontal-abduction',
  'horizontal-pull',
  'horizontal-push',
  'isometric',
  'knee-extension',
  'knee-flexion',
  'loaded-carry',
  'locomotion',
  'lunge',
  'plantar-flexion',
  'power',
  'rotation',
  'scapular-elevation',
  'shoulder-abduction',
  'shoulder-extension',
  'shoulder-flexion',
  'spinal-flexion',
  'squat',
  'vertical-pull',
  'vertical-push',
  'wrist-extension',
  'wrist-flexion',
];
export const bodyRegion = [true, 'core', 'lower-body', 'upper-body'];
export const mechanics = ['pull', 'push', 'static'];
export const exerciseType = ['compound', 'isolation'];
export const trackableMetrics = [
  'addedWeight',
  'assistedWeight',
  'duration',
  'reps',
  'rpe',
  'sets',
  'tempo',
  'weight',
];
