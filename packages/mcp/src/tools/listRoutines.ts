import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { reploClientForRequest } from "../upstream/requestClient.js";
import { jsonContent, toolError } from "./helpers.js";

export function registerListRoutines(server: McpServer) {
  server.registerTool(
    "list_routines",
    {
      title: "List workout routines",
      description:
        "List the user's workout routines, most recent first, as compact summaries " +
        "(id, name, exercise count). Optionally filter by date range. Use get_routine to pull the full detail of one routine.",
      inputSchema: {
        from: z
          .string()
          .optional()
          .describe(
            "ISO date, inclusive lower bound on routine creation (e.g. 2026-08-01)",
          ),
        to: z
          .string()
          .optional()
          .describe("ISO date, inclusive upper bound on routine creation"),
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe("Max routines to return (default 20)"),
      },
    },
    async ({ from, to, limit }, extra) => {
      try {
        const client = reploClientForRequest(extra);
        const all = await client.getMyRoutines();
        const fromT = from ? Date.parse(from) : undefined;
        const toT = to ? Date.parse(to) : undefined;

        const filtered = all.filter((r) => {
          if (!r.createdAt) return fromT === undefined && toT === undefined;
          const t = Date.parse(r.createdAt);
          if (fromT !== undefined && t < fromT) return false;
          if (toT !== undefined && t > toT) return false;
          return true;
        });

        filtered.sort(
          (a, b) =>
            Date.parse(b.createdAt ?? "0") - Date.parse(a.createdAt ?? "0"),
        );

        if (limit !== undefined) {
          filtered.splice(limit);
        }

        return jsonContent(filtered);
      } catch (err) {
        return toolError(err);
      }
    },
  );
}
