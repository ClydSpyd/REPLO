import { Exercise, ExerciseInput } from "./exercise.types";
import resistanceExercises from "../../assets/data/resistance_exercises_base.json";

/**
 * index the exercise catalog once at module load for enrichment lookups (by slug id, * with a secondary index by lowercased display name for resolving legacy entries).
 */
const catalog = resistanceExercises as unknown as Exercise[];
const byId = new Map<string, Exercise>(catalog.map((e) => [e.id, e]));
const byName = new Map<string, Exercise>(
  catalog.map((e) => [e.name.toLowerCase(), e]),
);

/** True if the slug id resolves to a known catalog exercise. */
export const exerciseExists = (exerciseId: string): boolean =>
  byId.has(exerciseId);


export interface EnrichedExercise {
  exerciseId: string;
  name: string;
  sets: ExerciseInput["sets"];
  exerciseDetails?: Exercise; // muscle groups, equipment, etc. — undefined if unresolved
}

/**
 * Enrich a stored workout/routine exercise entry with catalog metadata
 * (muscleGroups, primary/secondary muscle groups, equipment, ...) resolved
 * from the exercise slug id. Muscle-group data is not persisted on the
 * workout — it lives on the catalog and is attached here at read time, so
 * catalog corrections propagate to all workouts automatically.
 *
 * Resolution order: explicit `exerciseId` FK only.
 */
export function enrichExerciseEntry(ex: ExerciseInput): EnrichedExercise {
  const exerciseId = (ex as { exerciseId?: string }).exerciseId;

  const details = exerciseId ? byId.get(exerciseId) : undefined;

  return {
    exerciseId: exerciseId ?? details?.id ?? "",
    name: details?.name ?? "",
    sets: ex.sets,
    exerciseDetails: details,
  };
}

/** Enrich a list of stored exercise entries. */
export const enrichExercises = (exercises: ExerciseInput[]): EnrichedExercise[] =>
  exercises.map(enrichExerciseEntry);

/**
 * Return a workout or routine with its `exercises` enriched. Accepts either a
 * lean plain object or a hydrated Mongoose document (normalised via toObject),
 * so callers don't have to care which the repository handed them.
 */
export function withEnrichedExercises(entity: any) {
  const plain =
    typeof entity?.toObject === "function" ? entity.toObject() : entity;

  return {
    ...plain,
    exercises: enrichExercises((plain.exercises ?? []) as ExerciseInput[]),
  };
}
