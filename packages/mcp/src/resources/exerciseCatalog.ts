import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ReploClient } from "../upstream/reploClient.js";

/**
 * The static exercise catalog exposed as a read-only MCP *resource* (not a
 * tool). Resources are context the client/user can load deliberately; the
 * catalog is stable reference data, so it fits that shape better than a tool.
 */
export function registerExerciseCatalog(server: McpServer, client: ReploClient) {
  server.registerResource(
    "exercise-catalog",
    "exercise://catalog",
    {
      title: "REPLO exercise catalog",
      description:
        "The static REPLO exercise catalog (slug ids, names, muscle groups, equipment). " +
        "Read-only reference for interpreting sessions and building routines.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(await client.getExerciseCatalog()),
        },
      ],
    }),
  );
}
