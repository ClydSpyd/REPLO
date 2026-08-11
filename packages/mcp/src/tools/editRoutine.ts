import { z } from "zod";
import {
  createRoutineFields,
  routineExerciseFields,
  routineSetFields,
} from "@replo/shared";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { reploClientForRequest } from "../upstream/requestClient.js";
import { jsonContent, toolError } from "./helpers.js";

export function registerEditRoutine(server: McpServer) {
    server.registerTool("edit_routine", {
      title: "Edit routine",
      description:
        "Edit an existing workout routine (a template) for the user. IMPORTANT: resolve " +
        "each exercise's exerciseId slug via search_exercises FIRST — unknown slugs are " +
        "rejected by the API. `tags` is required (e.g. ['push','upper']).",
      inputSchema: z.object({
        id: z.string().min(1).describe("Routine ID to edit"),
        name: createRoutineFields.name.describe(
          "Routine name, e.g. 'Push Day A'",
        ),
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
                .describe(
                  "Catalog slug from search_exercises, e.g. 'barbell-bench-press'",
                ),
              sets: z
                .array(z.object(routineSetFields))
                .min(1)
                .describe("Planned sets for this exercise"),
            }),
          )
          .min(1)
          .describe("Exercises with their planned sets"),
      }).partial(),
    }, async (input, extra) => {
      try {
        const client = reploClientForRequest(extra);
        const { id, ...body } = input;
        const routine = await client.editRoutine(id!, body);
        return jsonContent({ updated: true, routine });
      } catch (err) {
        return toolError(err);
      }
    });
}