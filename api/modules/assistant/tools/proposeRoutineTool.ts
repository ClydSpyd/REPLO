import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import {
  createRoutineFields,
  routineExerciseFields,
  routineSetFields,
} from "@replo/shared";
import { exerciseExists, enrichExerciseEntry } from "../../exercise/exercise.utils";

/** One exercise as presented on the confirm card (and re-submitted on Add). */
export interface ProposedExercise {
  exerciseId: string;
  name: string;
  primaryMuscleGroups: string[];
  sets: { reps: number; weight: number }[];
}

export interface RoutineProposal {
  name: string;
  description?: string;
  tags: string[];
  exercises: ProposedExercise[];
}

/**
 * Presents a routine to the user as a confirm card WITHOUT writing anything.
 * `emitProposal` streams the payload to the client (SSE); the user creates the
 * routine themselves via the existing REST route. Keeps the agentic loop
 * read-only/idempotent.
 */
export const createProposeRoutineTool = (
  emitProposal: (proposal: RoutineProposal) => void | Promise<void>,
) =>
  betaZodTool({
    name: "propose_routine",
    description:
      "Present a workout routine to the user as a confirmation card. Use this " +
      "whenever the user wants to build, create, or save a routine — do NOT create " +
      "it silently. The user reviews the card and saves it themselves. IMPORTANT: " +
      "resolve each exercise's exerciseId slug via search_exercises FIRST — unknown " +
      "slugs are rejected. `tags` is required (e.g. ['push','upper']).",
    inputSchema: z.object({
      name: createRoutineFields.name.describe("Routine name, e.g. 'Push Day A'"),
      description: createRoutineFields.description.describe(
        "Optional free-text description",
      ),
      tags: createRoutineFields.tags
        .min(1)
        .describe("At least one tag/label, e.g. ['push','hypertrophy']"),
      exercises: z
        .array(
          z.object({
            exerciseId: routineExerciseFields.exerciseId
              .min(1)
              .describe("Catalog slug from search_exercises, e.g. 'barbell-bench-press'"),
            sets: z
              .array(
                z.object({
                  reps: routineSetFields.reps.describe("Repetitions (positive integer)"),
                  weight: routineSetFields.weight.describe(
                    "Weight in the user's units (>= 0; use 0 for bodyweight)",
                  ),
                }),
              )
              .min(1)
              .describe("Planned sets for this exercise"),
          }),
        )
        .min(1)
        .describe("Exercises with their planned sets"),
    }),
    run: async (input) => {
      // Reject unknown slugs so the model re-resolves rather than showing a
      // card the create endpoint would later reject.
      const unknown = input.exercises
        .map((e) => e.exerciseId)
        .filter((id) => !exerciseExists(id));
      if (unknown.length) {
        return JSON.stringify({
          error: `unknown exerciseId slug(s): ${unknown.join(", ")}. Re-resolve via search_exercises.`,
        });
      }

      // Enrich slugs → display name + muscle groups so the card renders without
      // a second lookup.
      const proposal: RoutineProposal = {
        name: input.name,
        description: input.description,
        tags: input.tags,
        exercises: input.exercises.map((ex) => {
          const enriched = enrichExerciseEntry(ex);
          return {
            exerciseId: ex.exerciseId,
            name: enriched.name,
            primaryMuscleGroups:
              enriched.exerciseDetails?.primaryMuscleGroups ?? [],
            sets: ex.sets,
          };
        }),
      };

      await emitProposal(proposal);
      return JSON.stringify({ presented: true });
    },
  });
