import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { reploClientForRequest } from "../upstream/requestClient.js";
import { jsonContent, toolError } from "./helpers.js";

/**
 * The "composite" tool: it is NOT a 1:1 proxy for one endpoint. It fans out to
 * four metrics endpoints in parallel and returns a single snapshot the model
 * can narrate — a purpose-built, task-shaped tool.
 */
export function registerAnalyzeWeek(server: McpServer) {
  server.registerTool(
    "analyze_week",
    {
      title: "Analyze training period",
      description:
        "Produce a combined analytics snapshot of the user's recent training: total & " +
        "series volume, muscle-group balance, the 8-week/28-day volume trend, and personal " +
        "bests. Defaults to the past week. Use for questions like 'how was my week?', " +
        "'am I neglecting a muscle group?', or 'what are my PRs?'.",
      inputSchema: {
        period: z
          .enum(["week", "month"])
          .optional()
          .describe("Analysis window (default 'week')"),
      },
    },
    async ({ period }, extra) => {
      try {
        const client = reploClientForRequest(extra);
        const p = period ?? "week";
        const [volume, muscleBalance, volumeTrend, personalBests] =
          await Promise.all([
            client.getVolume(p),
            client.getMuscleBalance(p),
            client.getVolumeTrend(),
            client.getPersonalBests(),
          ]);
        return jsonContent({
          period: p,
          volume,
          muscleBalance,
          volumeTrend,
          personalBests,
        });
      } catch (err) {
        return toolError(err);
      }
    },
  );
}
