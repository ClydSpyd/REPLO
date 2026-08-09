import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ReploClient } from "../upstream/reploClient.js";
import { jsonContent, toolError } from "./helpers.js";

// Mirrors the API's CreateRoutineSchema. The `.describe()` calls become part of
// the JSON Schema the model reads, so they double as instructions.
const setSchema = z.object({
  reps: z.number().int().positive().describe("Repetitions (positive integer)"),
  weight: z
    .number()
    .nonnegative()
    .describe("Weight in the user's units (>= 0; use 0 for bodyweight)"),
});

export function registerCreateRoutine(server: McpServer, client: ReploClient) {
  server.registerTool(
    "create_routine",
    {
      title: "Create routine",
      description:
        "Create a reusable workout routine (a template) for the user. IMPORTANT: resolve " +
        "each exercise's exerciseId slug via search_exercises FIRST — unknown slugs are " +
        "rejected by the API. `tags` is required (e.g. ['push','upper']).",
      inputSchema: {
        name: z.string().min(1).describe("Routine name, e.g. 'Push Day A'"),
        description: z.string().optional().describe("Optional free-text description"),
        tags: z
          .array(z.string())
          .min(1)
          .describe("At least one tag/label, e.g. ['push','hypertrophy']"),
        exercises: z
          .array(
            z.object({
              exerciseId: z
                .string()
                .min(1)
                .describe("Catalog slug from search_exercises, e.g. 'barbell-bench-press'"),
              sets: z.array(setSchema).min(1).describe("Planned sets for this exercise"),
            }),
          )
          .min(1)
          .describe("Exercises with their planned sets"),
      },
    },
    async (input) => {
      try {
        const routine = await client.createRoutine(input);
        return jsonContent({ created: true, routine });
      } catch (err) {
        return toolError(err);
      }
    },
  );
}
