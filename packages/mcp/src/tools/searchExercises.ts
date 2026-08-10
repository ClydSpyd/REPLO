import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { reploClientForRequest } from "../upstream/requestClient.js";
import { jsonContent, toolError } from "./helpers.js";

// We only surface a few fields — catalog entries are large and we don't want to
// flood the model's context with 121-field objects on every search.
interface CatalogEntry {
  id?: string;
  name?: string;
  primaryMuscleGroups?: string[];
  equipment?: string[];
}

export function registerSearchExercises(server: McpServer) {
  server.registerTool(
    "search_exercises",
    {
      title: "Search exercises",
      description:
        "Search REPLO's exercise catalog by name, muscle group, or alias. Use this to " +
        "find the canonical exerciseId slug (e.g. 'barbell-bench-press') required by " +
        "create_routine, or to look up what an exercise trains. Returns id, name, primary " +
        "muscle groups, and equipment.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("Free text, e.g. 'bench', 'squat', 'biceps'"),
      },
    },
    async ({ query }, extra) => {
      try {
        const client = reploClientForRequest(extra);
        const results = (await client.searchExercises(query)) as CatalogEntry[];
        const compact = results.slice(0, 25).map((e) => ({
          id: e.id,
          name: e.name,
          primaryMuscleGroups: e.primaryMuscleGroups,
          equipment: e.equipment,
        }));
        return jsonContent({ count: results.length, results: compact });
      } catch (err) {
        return toolError(err);
      }
    },
  );
}
