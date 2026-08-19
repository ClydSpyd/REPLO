import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { WorkoutService } from "../../workout/workout.service";

export const createListSessionsTool = (userId: string) =>
  betaZodTool({
    name: "list_sessions",
    description:
      "List the user's past workout sessions, most recent first, as compact summaries " +
      "(id, name, start/end, exercise count, completed sets, total volume). Optionally " +
      "filter by date range. Use get_session to pull the full detail of one session.",
    inputSchema: z.object({
      from: z
        .string()
        .optional()
        .describe(
          "ISO date, inclusive lower bound on session start (e.g. 2026-08-01)",
        ),
      to: z
        .string()
        .optional()
        .describe("ISO date, inclusive upper bound on session start"),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Max sessions to return (default 20)"),
    }),
    run: async ({ from, to, limit }) => {
      const service = new WorkoutService();
      const finalSessions = await service.getUserWorkouts(userId).then((all) => {
        const fromT = from ? Date.parse(from) : undefined;
        const toT = to ? Date.parse(to) : undefined;

        const filtered = all.filter((w) => {
          if (!w.started) return fromT === undefined && toT === undefined;
          const t = Date.parse(w.started);
          if (fromT !== undefined && t < fromT) return false;
          if (toT !== undefined && t > toT) return false;
          return true;
        });

        filtered.sort(
          (a, b) => Date.parse(b.started ?? "0") - Date.parse(a.started ?? "0"),
        );

        const sessions = filtered.slice(0, limit ?? 20).map((w) => ({
          id: w._id,
          name: w.name,
          started: w.started,
          ended: w.ended,
          exerciseCount: w.exercises?.length ?? 0,
          completedSets:
            w.exercises?.reduce(
              (acc: number, ex: any) =>
                acc + (ex.sets?.filter((s: any) => s.completed).length ?? 0),
              0,
            ) ?? 0,
          totalVolume:
            w.exercises?.reduce(
              (acc: number, ex: any) =>
                acc +
                (ex.sets?.reduce(
                  (setAcc: number, s: any) => setAcc + (s.completed ? s.reps * s.weight : 0),
                  0,
                ) ?? 0),
              0,
            ) ?? 0,
        }));
        return sessions;
      });
      return JSON.stringify({ sessions: finalSessions });
    },
  });
