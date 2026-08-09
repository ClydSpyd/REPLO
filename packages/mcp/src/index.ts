import "dotenv/config";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ReploClient } from "./upstream/reploClient.js";
import { registerSearchExercises } from "./tools/searchExercises.js";
import { registerListSessions } from "./tools/listSessions.js";
import { registerGetSession } from "./tools/getSession.js";
import { registerCreateRoutine } from "./tools/createRoutine.js";
import { registerAnalyzeWeek } from "./tools/analyzeWeek.js";
import { registerExerciseCatalog } from "./resources/exerciseCatalog.js";
import { registerEditRoutine } from "./tools/editRoutine.js";

const PORT = Number(process.env.PORT ?? 8080);

// M1: one shared client logged in as a single dev user. In M3 this is replaced
// by a per-request client acting as the authenticated OAuth user.
const client = new ReploClient({
  baseUrl: process.env.REPLO_API_URL ?? "http://localhost:6969",
  email: process.env.REPLO_EMAIL ?? "",
  password: process.env.REPLO_PASSWORD ?? "",
});

/** Build a fresh MCP server with our tools + resource registered. */
function createMcpServer(): McpServer {
  const server = new McpServer({ name: "replo-mcp", version: "0.0.0" });

  registerSearchExercises(server, client);
  registerListSessions(server, client);
  registerGetSession(server, client);
  registerCreateRoutine(server, client);
  registerAnalyzeWeek(server, client);
  registerExerciseCatalog(server, client);
  registerEditRoutine(server, client);

  return server;
}

const app = express();
app.use(express.json());

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "replo-mcp" });
});

// Stateless MCP endpoint: fresh server + transport per POST (see M0 notes).
app.post("/mcp", async (req: Request, res: Response) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const methodNotAllowed = (_req: Request, res: Response) =>
  res.status(405).json({ error: "Method not allowed in stateless mode" });
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

app.listen(PORT, () => {
  console.log(`[replo-mcp] listening on http://localhost:${PORT}  (POST /mcp)`);
});
