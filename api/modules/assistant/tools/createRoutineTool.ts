import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import {
  createRoutineFields,
  routineExerciseFields,
  routineSetFields,
} from "@replo/shared";
import { RoutineService } from "../../routine/routine.service";

const service = new RoutineService();

export const createCreateRoutineTool = (userId: string) => betaZodTool({
  name: "create_routine",
  description:
    "Create a reusable workout routine (a template) for the user. IMPORTANT: resolve " +
    "each exercise's exerciseId slug via search_exercises FIRST — unknown slugs are " +
    "rejected by the API. `tags` is required (e.g. ['push','upper']).",
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
          sets: z.array(
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
    const routine = await service.createRoutine(input, userId);
    return JSON.stringify({ created: true, routine });
  },
});