import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ReploClient } from "../upstream/reploClient.js";
import { jsonContent, toolError } from "./helpers.js";

export function registerGetSession(server: McpServer, client: ReploClient) {
  server.registerTool(
    "get_session",
    {
      title: "Get workout session",
      description:
        "Get the full, catalog-enriched detail of a single workout session by id (the " +
        "_id from list_sessions). Includes every exercise with its muscle groups and all " +
        "sets (reps, weight, completed).",
      inputSchema: {
        id: z.string().min(1).describe("Session id (the _id from list_sessions)"),
      },
    },
    async ({ id }) => {
      try {
        return jsonContent(await client.getWorkout(id));
      } catch (err) {
        return toolError(err);
      }
    },
  );
}
