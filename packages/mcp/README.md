# @replo/mcp — REPLO MCP server

A remote **Model Context Protocol** server that exposes REPLO's training data to
MCP-capable AI clients (Claude Code / Claude Desktop, Cursor, …). It runs as its
own Node process — separate from the REPLO API — and calls the existing `/api/*`
endpoints on the user's behalf, secured with **OAuth 2.1** per the MCP
authorization spec.

- **Transport:** remote **Streamable HTTP** (`POST /mcp`), stateless.
- **Auth:** OAuth 2.1 — the server is both the **resource server** (validates the
  client's token) and the **authorization server** (logs the user in, issues
  tokens). Any existing REPLO user signs in with their REPLO email/password
  through the server's own login page.
- **Data:** never touches Mongo directly; every tool calls REPLO's REST API as
  the authenticated user.

---

## Contents
- [What you can do (capabilities)](#what-you-can-do-capabilities)
- [How it works (architecture)](#how-it-works-architecture)
- [Connect a client](#connect-a-client)
- [Local development](#local-development)
- [Endpoints / URLs](#endpoints--urls)
- [Environment variables](#environment-variables)
- [Testing without a browser (dev token + curl)](#testing-without-a-browser-dev-token--curl)
- [Deployment (Render)](#deployment-render)
- [Security notes](#security-notes)
- [Known limitations & roadmap](#known-limitations--roadmap)

---

## What you can do (capabilities)

Once connected, the model has these **tools** (all scoped to the signed-in user):

| Tool | What it does | Backed by |
|---|---|---|
| `search_exercises` | Search the exercise catalog by name / muscle / alias; returns canonical slugs (e.g. `barbell-bench-press`) | `GET /api/exercise/search` |
| `list_sessions` | List past workout sessions (most recent first), optional date range | `GET /api/workout/mine` |
| `get_session` | Full, catalog-enriched detail of one session | `GET /api/workout/:id` |
| `list_routines` | List the user's saved routines | `GET /api/routine/mine` |
| `analyze_week` | Composite analytics — volume, muscle balance, volume trend, personal bests (`week` or `month`) | `GET /api/userMetrics/*` |
| `create_routine` | Create a reusable routine (validates slugs against the catalog) | `POST /api/routine` |
| `edit_routine` | Edit an existing routine | `PATCH /api/routine/:id` |

Plus one **resource**:

| Resource URI | What it is |
|---|---|
| `exercise://catalog` | The static 121-entry exercise catalog (read-only reference the client can load into context) |

Example prompts once connected: *"analyze my week"*, *"what's my bench
progression?"*, *"list my push routines"*, *"build me a 4-exercise pull day and
save it."*

---

## How it works (architecture)

```
 Claude Code ──OAuth──▶  ┌─────────── @replo/mcp (one Node process) ───────────┐
 (any client)  Token A   │  AS: /authorize (REPLO login) · /token · /register  │
      │                  │      · /.well-known/oauth-authorization-server       │
      └──MCP + Token A──▶ │  RS: /mcp (Streamable HTTP) · protected-resource md │
                         └───────────────────────┬─────────────────────────────┘
                              Token B (REPLO JWT, server-side only)
                                                 ▼
                                      REPLO API (/api/*) ──▶ MongoDB
```

**The two-token model.** The client holds **Token A** (issued by this server,
audience = this server). At login the server verifies the user's REPLO
credentials against `POST /api/user/login` and stores the resulting **REPLO JWT
(Token B)** server-side, tied to Token A. On each `/mcp` call the server
validates Token A, looks up Token B, and calls `/api/*` as that user. Token B is
never exposed to the client (no token passthrough).

**Standards:** OAuth 2.1 (PKCE + Resource Indicators), Protected Resource
Metadata (RFC 9728), Authorization Server Metadata (RFC 8414), Dynamic Client
Registration (RFC 7591). Clients discover everything automatically from the
`.well-known` documents.

---

## Connect a client

The server must be running and reachable over the host set in `MCP_PUBLIC_URL`.

**Claude Code** (user scope = available in every project):
```bash
claude mcp add --scope user --transport http replo https://<mcp-host>/mcp
claude mcp list        # should show:  replo … ✔ Connected  (may say "needs authentication" first)
```

On first use the client runs discovery + Dynamic Client Registration, then opens
a browser to `https://<mcp-host>/authorize` — sign in with your **REPLO**
email/password. It redirects back, the client exchanges the code for a token, and
you're connected. Then just ask it things (*"analyze my week"*).

- Local dev host: `http://localhost:8080/mcp` (see below).
- Hosted example: `https://mcp.replo-app.com/mcp` (or the `*.onrender.com` URL).
- The connect URL host **must match** `MCP_PUBLIC_URL` exactly, or OAuth
  discovery fails.

---

## Local development

From the repo root (npm workspaces):

```bash
npm install
```

Create `packages/mcp/.env` from the example and fill it in:

```bash
cp packages/mcp/.env.example packages/mcp/.env
# set REPLO_EMAIL / REPLO_PASSWORD to a real REPLO account (dev-token convenience),
# and MCP_DEV_TOKEN to any random string (for curl testing).
```

Run it (needs the REPLO API running on `:6969` — e.g. `npm run dev:api`):

```bash
npm run dev  -w @replo/mcp     # tsx watch — auto-reloads on save
# or all three services at once, from the repo root:
npm run dev:full               # api + web + mcp
```

Startup logs:
```
[replo-mcp] listening on http://localhost:8080  (POST /mcp)
[replo-mcp] issuer / resource: http://localhost:8080
[replo-mcp] AS metadata: http://localhost:8080/.well-known/oauth-authorization-server
[replo-mcp] seeded MCP_DEV_TOKEN for local testing
```

### Scripts (`-w @replo/mcp`)

| Command | Does |
|---|---|
| `npm run dev` | `tsx watch src/index.ts` — dev server with reload |
| `npm run smoke` | Standalone check of the upstream `ReploClient` (login + a couple of reads) — no MCP server |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | Run the compiled server (`node dist/index.js`) |

### Testing the OAuth flow locally

The OAuth **authorization-server endpoints must be HTTPS** for real clients
(localhost is exempt for the issuer, but a client's browser redirect + discovery
are smoothest over HTTPS). To exercise the full browser flow locally, expose the
server with a tunnel and point `MCP_PUBLIC_URL` at it:

```bash
cloudflared tunnel --url http://localhost:8080      # or: ngrok http 8080
# then set MCP_PUBLIC_URL=https://<tunnel-host> in .env and restart
claude mcp add --scope user --transport http replo https://<tunnel-host>/mcp
```

For quick, browser-free testing use the **dev token** path below.

---

## Endpoints / URLs

All relative to `MCP_PUBLIC_URL`.

| Method | Path | Auth | Purpose |
|---|---|:--:|---|
| `GET` | `/healthz` | – | Liveness probe → `{ ok: true, service: "replo-mcp" }` |
| `POST` | `/mcp` | Bearer (Token A) | The MCP Streamable HTTP endpoint (JSON-RPC). `401` + `WWW-Authenticate` when unauthenticated |
| `GET` | `/.well-known/oauth-protected-resource` | – | RFC 9728 — names the authorization server |
| `GET` | `/.well-known/oauth-authorization-server` | – | RFC 8414 — authorize/token/register endpoints |
| `GET`/`POST` | `/authorize` | – | Renders the REPLO login page (start of the OAuth flow) |
| `POST` | `/login` | – | Login form target — verifies REPLO creds, issues the auth code |
| `POST` | `/token` | – | Exchanges auth code (or refresh token) for Token A |
| `POST` | `/register` | – | Dynamic Client Registration (RFC 7591) |

(`GET`/`DELETE /mcp` return `405` — the server runs in stateless mode.)

---

## Environment variables

Copy `.env.example` → `.env`. Placeholders only in the example; never commit real
secrets (`.env` is gitignored).

| Var | Required | Purpose |
|---|:--:|---|
| `REPLO_API_URL` | ✅ | Upstream REPLO API base (e.g. `http://localhost:6969`, or `https://replo-app.com` in prod) |
| `MCP_PUBLIC_URL` | ✅ | This server's public origin — becomes the OAuth **issuer / resource identifier** and is baked into discovery. Must match the URL clients connect to |
| `PORT` | – | Listen port (defaults to `8080`; hosting platforms inject their own) |
| `MCP_DEV_TOKEN` | dev | Static bearer token seeded at boot for curl testing. On boot the server logs in `REPLO_EMAIL`/`REPLO_PASSWORD` and attaches that REPLO JWT so tools work with it. **Omit in production** |
| `REPLO_EMAIL` / `REPLO_PASSWORD` | dev | A real REPLO account used only to back `MCP_DEV_TOKEN`. **Omit in production** |
| `MCP_ACCESS_TOKEN_TTL` | – | Access-token (Token A) lifetime in seconds (default `900`) |
| `MCP_REFRESH_TOKEN_TTL` | – | Refresh-token lifetime in seconds (default `2592000`) |
| `MCP_TOKEN_SIGNING_KEY` | – | Reserved for signed tokens (opaque tokens are used today) |

> ⚠️ **Production:** do **not** set `MCP_DEV_TOKEN`, `REPLO_EMAIL`, or
> `REPLO_PASSWORD` — those only exist to make local/curl testing convenient and
> would otherwise be a static backdoor identity.

---

## Testing without a browser (dev token + curl)

With `MCP_DEV_TOKEN` set (and `REPLO_EMAIL`/`REPLO_PASSWORD` for a real account),
you can hit `/mcp` directly. Use a heredoc so shell line-wrapping can't corrupt
the JSON, and include `Accept: text/event-stream` (Streamable HTTP replies as
SSE):

```bash
# List tools
curl -s -X POST http://localhost:8080/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -H 'Authorization: Bearer dev-secret-token-123' \
  --data-binary @- <<'JSON'
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
JSON

# Call a tool (acts as the dev account)
curl -s -X POST http://localhost:8080/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -H 'Authorization: Bearer dev-secret-token-123' \
  --data-binary @- <<'JSON'
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"analyze_week","arguments":{}}}
JSON
```

Discovery docs (no auth):
```bash
curl -s http://localhost:8080/.well-known/oauth-authorization-server
curl -s http://localhost:8080/.well-known/oauth-protected-resource
```

---

## Deployment (Render)

Deploys as a **second Render Web Service** (separate from the REPLO app). A
blueprint lives at the repo root ([`render.yaml`](../../render.yaml)).

| Setting | Value |
|---|---|
| Root directory | repo root (so npm workspaces resolve) |
| Build command | `npm ci && npm run build -w @replo/shared && npm run build -w @replo/mcp` |
| Start command | `node packages/mcp/dist/index.js` |
| Health check path | `/healthz` |
| Instances | **single** (see limitation below) |

**Env on the service:** `MCP_PUBLIC_URL` = the service's public HTTPS URL (custom
domain or `*.onrender.com`), `REPLO_API_URL` = the REPLO API's public URL. Render
injects `PORT` and provisions TLS automatically — that HTTPS is what satisfies
the OAuth requirement (no tunnel needed in prod). Add a custom domain (e.g.
`mcp.replo-app.com`) via a CNAME to the service, and keep `MCP_PUBLIC_URL` in
lockstep with whatever host clients actually use.

Behind a proxy (Render), the server sets `trust proxy` so the OAuth rate limiter
reads the real client IP.

---

## Security notes

- **Per-user isolation** — every tool acts with the authenticated user's REPLO
  JWT; the model can only ever read/act on that user's data.
- **No token passthrough** — the client's Token A is never forwarded upstream;
  the REPLO JWT (Token B) is server-side only.
- **PKCE + audience validation** — auth codes are single-use and PKCE-verified;
  tokens are checked against this server's canonical URI.
- **Secrets** — `.env` is gitignored; the example holds placeholders only. Don't
  ship `MCP_DEV_TOKEN` to production.

---

## Known limitations & roadmap

- **In-memory token/client/code stores.** OAuth state lives in memory today, so a
  **restart (deploy/crash) drops all tokens** — clients must re-authenticate, and
  the service must run as a **single instance** (a token minted on one instance
  won't validate on another). Persisting these stores to Mongo (and short-lived
  access tokens + refresh rotation) is the next hardening step before multi-user
  production use.
- **No refresh-token rotation yet** beyond reissuing access tokens.
- A production-grade alternative is to **delegate the authorization server** to a
  managed IdP (Auth0 / Keycloak / Ory) via the SDK's `ProxyOAuthServerProvider`,
  keeping this service as a thin resource server. The self-hosted AS here was
  built to own the full flow end-to-end.

For the design rationale and build history, see the repo-root
[`MCP-EXPLORATION.md`](../../MCP-EXPLORATION.md).
