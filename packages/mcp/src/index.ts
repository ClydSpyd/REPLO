import "dotenv/config";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { ReploClient } from "./upstream/reploClient.js";
import { tokenStore } from "./auth/tokenStore.js";
import { tokenVerifier } from "./auth/verifier.js";
import { provider } from "./auth/provider.js";
import { makeLoginHandler } from "./auth/loginHandler.js";
import { registerSearchExercises } from "./tools/searchExercises.js";
import { registerListSessions } from "./tools/listSessions.js";
import { registerGetSession } from "./tools/getSession.js";
import { registerCreateRoutine } from "./tools/createRoutine.js";
import { registerAnalyzeWeek } from "./tools/analyzeWeek.js";
import { registerExerciseCatalog } from "./resources/exerciseCatalog.js";
import { registerEditRoutine } from "./tools/editRoutine.js";
import { registerListRoutines } from "./tools/listRoutines.js";

const PORT = Number(process.env.PORT ?? 8080);
const REPLO_API_URL = process.env.REPLO_API_URL ?? "http://localhost:6969";
// Our canonical URI (RFC 8707 resource identifier + OAuth issuer). No trailing slash.
const MCP_PUBLIC_URL = (
  process.env.MCP_PUBLIC_URL ?? `http://localhost:${PORT}`
).replace(/\/$/, "");
const RESOURCE_METADATA_URL = `${MCP_PUBLIC_URL}/.well-known/oauth-protected-resource`;

/**
 * Build a fresh MCP server with our tools + resource registered. Each tool
 * builds its own per-request ReploClient (from the request's auth context), so
 * calls act as the authenticated OAuth user — there is no shared dev client.
 */
function createMcpServer(): McpServer {
  const server = new McpServer({ name: "replo-mcp", version: "0.0.0" });

  registerSearchExercises(server);
  registerListSessions(server);
  registerGetSession(server);
  registerCreateRoutine(server);
  registerAnalyzeWeek(server);
  registerExerciseCatalog(server);
  registerListRoutines(server);
  registerEditRoutine(server);

  return server;
}

const app = express();
app.use(express.json());

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "replo-mcp" });
});

// --- OAuth 2.1 Authorization Server + Resource Server discovery ---
// mcpAuthRouter mounts /authorize, /token, /register, and BOTH .well-known docs
// (authorization-server + protected-resource). Must be installed at app root.
app.use(
  mcpAuthRouter({
    provider,
    issuerUrl: new URL(MCP_PUBLIC_URL),
    resourceServerUrl: new URL(MCP_PUBLIC_URL),
    resourceName: "REPLO MCP",
    scopesSupported: [],
  }),
);

// Our own login endpoint: the login page (rendered by provider.authorize) POSTs
// credentials here; we verify them against REPLO and redirect back with a code.
app.post(
  "/login",
  express.urlencoded({ extended: false }),
  makeLoginHandler(REPLO_API_URL),
);

// --- Resource Server: token enforcement on the MCP endpoint ---
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

// Dev-only: seed a static bearer token so curl can hit /mcp without the full
// OAuth dance. To make tools work with it, we log in the dev creds once and
// attach that REPLO JWT (Token B) as `extra.reploToken` — exactly what a real
// OAuth token carries. Without dev creds it still passes the RS gate, but tools
// will report "No REPLO token" (nothing to act as).
const DEV_TOKEN = process.env.MCP_DEV_TOKEN;
async function seedDevToken(): Promise<void> {
  if (!DEV_TOKEN) return;
  let reploToken: string | undefined;
  if (process.env.REPLO_EMAIL && process.env.REPLO_PASSWORD) {
    try {
      reploToken = await new ReploClient({
        baseUrl: REPLO_API_URL,
        email: process.env.REPLO_EMAIL,
        password: process.env.REPLO_PASSWORD,
      }).login();
    } catch (err) {
      console.error("[replo-mcp] dev token: REPLO login failed —", err);
    }
  }
  tokenStore.set(DEV_TOKEN, {
    token: DEV_TOKEN,
    clientId: "dev-cli",
    scopes: [],
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1y (dev)
    resource: new URL(MCP_PUBLIC_URL),
    extra: reploToken ? { reploToken } : undefined,
  });
}

app.listen(PORT, () => {
  console.log(`[replo-mcp] listening on http://localhost:${PORT}  (POST /mcp)`);
  console.log(`[replo-mcp] issuer / resource: ${MCP_PUBLIC_URL}`);
  console.log(`[replo-mcp] AS metadata: ${MCP_PUBLIC_URL}/.well-known/oauth-authorization-server`);
  void seedDevToken().then(() => {
    if (DEV_TOKEN) console.log("[replo-mcp] seeded MCP_DEV_TOKEN for local testing");
  });
});
