import "dotenv/config";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { metadataHandler } from "@modelcontextprotocol/sdk/server/auth/handlers/metadata.js";
import type { OAuthProtectedResourceMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";
import { ReploClient } from "./upstream/reploClient.js";
import { tokenStore } from "./auth/tokenStore.js";
import { tokenVerifier } from "./auth/verifier.js";
import { registerSearchExercises } from "./tools/searchExercises.js";
import { registerListSessions } from "./tools/listSessions.js";
import { registerGetSession } from "./tools/getSession.js";
import { registerCreateRoutine } from "./tools/createRoutine.js";
import { registerAnalyzeWeek } from "./tools/analyzeWeek.js";
import { registerExerciseCatalog } from "./resources/exerciseCatalog.js";
import { registerEditRoutine } from "./tools/editRoutine.js";

const PORT = Number(process.env.PORT ?? 8080);
// Our canonical URI (RFC 8707 resource identifier). No trailing slash.
const MCP_PUBLIC_URL = (
  process.env.MCP_PUBLIC_URL ?? `http://localhost:${PORT}`
).replace(/\/$/, "");
const RESOURCE_METADATA_URL = `${MCP_PUBLIC_URL}/.well-known/oauth-protected-resource`;

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

// --- OAuth 2.1 Resource Server: discovery (RFC 9728) ---
// Tells clients which authorization server(s) can issue tokens for us. The AS
// endpoints themselves are built in M3; for now this points at ourselves.
const protectedResourceMetadata: OAuthProtectedResourceMetadata = {
  resource: MCP_PUBLIC_URL,
  authorization_servers: [MCP_PUBLIC_URL],
  bearer_methods_supported: ["header"],
  resource_name: "REPLO MCP",
};
app.get(
  "/.well-known/oauth-protected-resource",
  metadataHandler(protectedResourceMetadata),
);

// --- OAuth 2.1 Resource Server: token enforcement ---
// Unauthenticated requests now get 401 + WWW-Authenticate pointing at the
// resource metadata, per spec. Valid tokens are attached to req.auth.
const bearer = requireBearerAuth({
  verifier: tokenVerifier,
  resourceMetadataUrl: RESOURCE_METADATA_URL,
});

// Stateless MCP endpoint: fresh server + transport per POST (see M0 notes).
app.post("/mcp", bearer, async (req: Request, res: Response) => {
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

// Dev-only: seed a static bearer token so we can exercise the authed path
// before the real login flow (M3) exists. Must carry expiresAt.
const DEV_TOKEN = process.env.MCP_DEV_TOKEN;
if (DEV_TOKEN) {
  tokenStore.set(DEV_TOKEN, {
    token: DEV_TOKEN,
    clientId: "dev-cli",
    scopes: [],
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1y (dev)
    resource: new URL(MCP_PUBLIC_URL),
  });
}

app.listen(PORT, () => {
  console.log(`[replo-mcp] listening on http://localhost:${PORT}  (POST /mcp)`);
  console.log(`[replo-mcp] resource metadata: ${RESOURCE_METADATA_URL}`);
  if (DEV_TOKEN) console.log("[replo-mcp] seeded MCP_DEV_TOKEN for local testing");
  else console.log("[replo-mcp] no MCP_DEV_TOKEN set — all /mcp calls will 401");
});
