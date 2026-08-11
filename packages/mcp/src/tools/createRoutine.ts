import { z } from "zod";
import {
  createRoutineFields,
  routineExerciseFields,
  routineSetFields,
} from "@replo/shared";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { reploClientForRequest } from "../upstream/requestClient.js";
import { jsonContent, toolError } from "./helpers.js";

// Built from the shared CreateRoutineSchema field shapes (@replo/shared) so the
// validation rules can't drift from the API. On top we layer `.describe()` —
// which becomes part of the JSON Schema the model reads, doubling as
// instructions — plus the stricter `.min(1)`s this tool wants.
const setSchema = z.object({
  reps: routineSetFields.reps.describe("Repetitions (positive integer)"),
  weight: routineSetFields.weight.describe(
    "Weight in the user's units (>= 0; use 0 for bodyweight)",
  ),
});

export function registerCreateRoutine(server: McpServer) {
  server.registerTool(
    "create_routine",
    {
      title: "Create routine",
      description:
        "Create a reusable workout routine (a template) for the user. IMPORTANT: resolve " +
        "each exercise's exerciseId slug via search_exercises FIRST — unknown slugs are " +
        "rejected by the API. `tags` is required (e.g. ['push','upper']).",
      inputSchema: {
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
              sets: z.array(setSchema).min(1).describe("Planned sets for this exercise"),
            }),
          )
          .min(1)
          .describe("Exercises with their planned sets"),
      },
    },
    async (input, extra) => {
      try {
        const client = reploClientForRequest(extra);
        const routine = await client.createRoutine(input);
        return jsonContent({ created: true, routine });
      } catch (err) {
        return toolError(err);
      }
    },
  );
}
