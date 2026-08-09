import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ReploClient, WorkoutTrimmed } from "../upstream/reploClient.js";
import { jsonContent, toolError } from "./helpers.js";

/** Sum of reps × weight over *completed* sets — the same notion of "volume". */
function totalVolume(w: WorkoutTrimmed): number {
  let vol = 0;
  for (const ex of w.exercises ?? []) {
    for (const s of ex.sets ?? []) {
      if (s.completed) vol += s.reps * s.weight;
    }
  }
  return vol;
}

export function registerListSessions(server: McpServer, client: ReploClient) {
  server.registerTool(
    "list_sessions",
    {
      title: "List workout sessions",
      description:
        "List the user's past workout sessions, most recent first, as compact summaries " +
        "(id, name, start/end, exercise count, completed sets, total volume). Optionally " +
        "filter by date range. Use get_session to pull the full detail of one session.",
      inputSchema: {
        from: z
          .string()
          .optional()
          .describe("ISO date, inclusive lower bound on session start (e.g. 2026-08-01)"),
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
      },
    },
    async ({ from, to, limit }) => {
      try {
        const all = await client.getMyWorkouts();
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
          completedSets: (w.exercises ?? []).reduce(
            (n, e) => n + (e.sets ?? []).filter((s) => s.completed).length,
            0,
          ),
          totalVolume: totalVolume(w),
        }));

        return jsonContent({ count: sessions.length, sessions });
      } catch (err) {
        return toolError(err);
      }
    },
  );
}
