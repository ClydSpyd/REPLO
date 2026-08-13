import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ExerciseService } from "../exercise/exercise.service";

const exerciseService = new ExerciseService();

/** The few catalog fields we surface — entries themselves are much larger. */
interface CatalogEntry {
  id: string;
  name: string;
  primaryMuscleGroups: string[];
  equipment: string[];
}

/** Cap on matches returned, to avoid flooding the model's context. */
const RESULT_LIMIT = 25;

/**
 * Read-only. Resolves free text (name / muscle group / alias) to catalog entries
 */
export const searchExercisesTool = betaZodTool({
  name: "search_exercises",
  description:
    "Search REPLO's exercise catalog by name, muscle group, or alias. Use this to " +
    "find the canonical exerciseId slug (e.g. 'barbell-bench-press') needed to build " +
    "a routine, or to look up what an exercise trains. Returns id, name, primary " +
    "muscle groups, and equipment. If totalMatches exceeds the number returned, " +
    "narrow the query with a more specific term.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Free text, e.g. 'bench', 'squat', 'biceps'"),
  }),
  run: async ({ query }) => {
    const matches = exerciseService.searchByText(query) as CatalogEntry[];
    const results = matches
      .slice(0, RESULT_LIMIT)
      .map(({ id, name, primaryMuscleGroups, equipment }) => ({
        id,
        name,
        primaryMuscleGroups,
        equipment,
      }));
    return JSON.stringify({
      totalMatches: matches.length,
      returned: results.length,
      results,
    });
  },
});
