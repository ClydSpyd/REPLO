# MCP Integration — REPLO

Design + build plan for a remote, OAuth-secured MCP server on top of REPLO. This is a
**learning-oriented** build (understanding MCP end-to-end), using the real app as substrate.

> **Seeding a new session:** point Claude at this file. It carries the app's shape, every
> decision that bears on the MCP work, the architecture, and the milestone we're on.

---

## Working style

Learn-by-doing: we build this **together, one milestone at a time**, not unattended. Each
step is explained (what + why) before code is written; small runnable increments over big
drops. The goal is understanding, not just a finished artifact.

## Goal

A **remote MCP server any REPLO user can reach from any MCP-capable client**, secured with
**OAuth 2.1** per the MCP authorization spec (2025-06-18). Framing: an
**analytics/assistant server** — query past sessions, author routines, analyze the week.

## Decisions

- **Transport:** remote **Streamable HTTP** (Express), not stdio.
- **Auth:** **OAuth 2.1** with a **self-hosted Authorization Server (AS) inside
  `packages/mcp`**, whose login step authenticates against REPLO's existing
  `POST /api/user/login`. Existing REPLO users work with existing credentials; the sensitive
  OAuth code stays isolated from the core `api` (reversible; can be promoted into `api/` later).
- **Topology:** new monorepo workspace package `packages/mcp` (`@replo/mcp`) = a **separate
  Node process** from `api`, deployed on the **same host** as REPLO, talking to `api` over HTTP.
- **Data access:** the MCP server calls REPLO's existing `/api/*` endpoints (reuses the
  auth/ownership/enrichment the routes already enforce).
- **First client:** Claude Code, via `claude mcp add --transport http`.
- **Tools (v1, focused, analytics):** `search_exercises`, `list_sessions`, `get_session`,
  `create_routine`, `analyze_week`, plus the exercise catalog as a resource.

## App facts that shape the design

1. **Exercises are referenced, not embedded.** Static JSON catalog
   (`api/assets/data/resistance_exercises_base.json`, ~121 slug-id entries). Workout/routine
   entries store only `exerciseId` + `sets`; catalog metadata is joined in **at read time**
   via an in-memory `Map`. → workout reads come back enriched; the catalog is a natural
   read-only MCP **resource**.
2. **Auth is JWT bearer.** `POST /api/user/login` returns an access/refresh pair;
   `authMiddleware` attaches `req.user`. All workout/routine/metrics routes are auth-gated and
   user-scoped.
3. **Service layer holds the logic.** `routes → controller → service → repository → model`.
   Relevant services: `WorkoutService`, `UserMetricsService` (volume, muscle balance, PBs,
   trend), `ExerciseService` (catalog search), `RoutineService`, `FavoriteService`,
   `UserService`. Our tools map onto the REST endpoints these back.

## MCP + OAuth concepts (the parts that shape this build)

- Our **MCP server = OAuth 2.1 resource server (RS)**: validates access tokens, serves
  tools/resources, returns `401 + WWW-Authenticate` when unauthenticated, and MUST reject
  tokens not issued for it (audience validation).
- The **Authorization Server (AS)** logs the user in and issues tokens — spec allows it
  **co-hosted with the RS**, which is our setup (both in `packages/mcp`).
- **Discovery:** RS serves `/.well-known/oauth-protected-resource` (RFC 9728); AS serves
  `/.well-known/oauth-authorization-server` (RFC 8414).
- **DCR** (RFC 7591, `/register`) so clients self-register. **PKCE** required. **Resource
  Indicators** (RFC 8707, `resource` param) required. **HTTPS** for AS endpoints; redirect
  URIs `localhost` or HTTPS.
- **No token passthrough** — see the two-token model.

### Two-token model (the crux)

- **Token A** — issued by *our* AS to the client; audience = our MCP server. Validated on
  every MCP request.
- **Token B** — the REPLO JWT from `/api/user/login`. Held **server-side only**, mapped from
  the authenticated user, used to call `/api/*`. **Never** exposed to the client. Our server
  is an RS to the client *and* an OAuth client to REPLO.

## Architecture

```
                         ┌─────────────── packages/mcp (one Node process) ───────────────┐
 Claude Code ──OAuth──▶  │  AS: /authorize (REPLO login form) · /token · /register        │
 (or any client)         │      · /.well-known/oauth-authorization-server                 │
      │  Token A         │  RS: /mcp (Streamable HTTP) · /.well-known/oauth-protected-...  │
      └──MCP + Token A──▶ │      requireBearerAuth → AuthInfo → {userId, REPLO JWT}        │
                         └──────────────────────────┬───────────────────────────────────┘
                                    Token B (REPLO JWT), server-side only
                                                    ▼
                                         api (/api/*)  ──▶  MongoDB
```

## Package structure

```
packages/mcp/                         # @replo/mcp — separate process, same monorepo
  package.json                        # deps: @modelcontextprotocol/sdk, express, zod
  tsconfig.json
  .env.example                        # REPLO_API_URL, MCP_PUBLIC_URL, token TTLs, signing key
  src/
    index.ts                          # Express: mount AS router, RS metadata, /mcp transport
    auth/
      provider.ts                     # OAuthServerProvider impl
      loginPage.ts                    # /authorize login+consent → posts REPLO creds
      tokenStore.ts                   # token/client/code store (in-memory first → Mongo later)
    upstream/reploClient.ts           # calls /api/* with a given user's REPLO JWT
    tools/  searchExercises · listSessions · getSession · createRoutine · analyzeWeek
    resources/  exerciseCatalog
```

Root `package.json` already globs `packages/*`. Import types from `@replo/shared` where useful.

## SDK building blocks (verify exact names/version at M0)

`StreamableHTTPServerTransport` (the `/mcp` transport) · `mcpAuthRouter` (AS metadata +
`/authorize` + `/token` + `/register`) · `OAuthServerProvider` (interface we implement) ·
`requireBearerAuth` + an `OAuthTokenVerifier` (validates Token A → `req.auth`).

## Auth flow (first connect)

1. Client hits `/mcp` with no token → `401` + `WWW-Authenticate` → fetches protected-resource
   metadata → learns the AS.
2. Client fetches AS metadata, does **DCR** to get a client_id.
3. Client opens `/authorize` (PKCE `code_challenge` + `resource`). Our page shows a **REPLO
   login form** → on submit we call `POST /api/user/login`, get **Token B**, store
   `{userId, reploJwt}` keyed to a fresh authorization code, redirect back with the code.
4. Client calls `/token` (`code_verifier` + `resource`) → we validate PKCE, issue **Token A**
   (audience = our canonical URI), keep the map Token A → Token B.
5. Client calls `/mcp` with Token A → validated → tool handlers use that user's Token B via
   `ReploClient`.

## Tools (v1) — transport/auth-agnostic

Each = Zod input schema + handler calling `ReploClient`, scoped to the authenticated user.

- **`search_exercises`** `{ query }` → `GET /api/exercise/search?query=` — resolve valid slugs.
- **`list_sessions`** `{ from?, to?, limit? }` → `GET /api/workout/mine`; filtered in handler;
  returns trimmed per-session summaries.
- **`get_session`** `{ id }` → `GET /api/workout/:id` — full enriched session.
- **`create_routine`** `{ name, description?, tags?, exercises:[{exerciseId, sets:[{reps,
  weight}]}] }` → `POST /api/routine` (resolve slugs via `search_exercises` first).
- **`analyze_week`** `{ period? }` → composite over `/api/userMetrics/volume`,
  `/muscle-balance`, `/volume-trend`, `/personal-bests` → one summary. (A tool ≠ one endpoint.)

**Resource:** `exercise://catalog` — static catalog (`GET /api/exercise/dataset`), read-only.

## Security checklist (before "done")

- [ ] Audience validation — reject Token A not issued for our canonical URI.
- [ ] PKCE enforced; exact redirect-URI matching; `state` verified.
- [ ] `resource` (Resource Indicator) required on authorize + token.
- [ ] No token passthrough — Token B never leaves the server.
- [ ] Short-lived Token A + refresh-token rotation for public clients.
- [ ] AS endpoints HTTPS; redirect URIs localhost/HTTPS only.
- [ ] Consent step before issuing for a newly registered client (confused-deputy).
- [ ] REPLO creds only transit `/authorize` POST → `/api/user/login`; never logged/stored
      plaintext. **No secrets in git** (`.env` ignored; `.env.example` placeholders only).

## Local dev / hosting

- **Dev:** run `api` (6969) + `packages/mcp`. Real OAuth clients need HTTPS for AS endpoints —
  use a tunnel (cloudflared/ngrok), set `MCP_PUBLIC_URL` to the tunnel origin. `localhost`
  redirect URIs allowed.
- **Prod (same box as REPLO):** run `packages/mcp` behind the existing TLS/reverse proxy at a
  public hostname; `MCP_PUBLIC_URL` = that hostname.

## Wiring into Claude Code

```
claude mcp add --transport http replo https://<mcp-public-url>/mcp
```
Claude Code hits `/mcp`, gets the `401`, runs discovery + DCR + the browser OAuth flow, then
lists the 5 tools + catalog resource.

## Build roadmap (milestones, done together)

- **M0 — scaffold + hello transport.** Create `packages/mcp`, wire the workspace, pick SDK
  version (confirm Zod-major compat), Express `/mcp` Streamable HTTP with ONE trivial tool, no
  auth. Connect Claude Code locally; verify.
- **M1 — the engine.** `ReploClient` + all 5 tools + catalog resource, unauthenticated (dev
  creds). Nail the MCP surface before auth.
- **M2 — resource-server auth.** protected-resource metadata, `401` + `WWW-Authenticate`,
  `requireBearerAuth` + in-memory verifier.
- **M3 — authorization server.** `mcpAuthRouter` + our `OAuthServerProvider`: `/authorize`
  login → `/api/user/login`, `/token`, DCR, PKCE, resource/audience checks, consent; wire
  per-request Token A → Token B lookup.
- **M4 — remote end-to-end.** HTTPS tunnel, full OAuth flow from a real client, test a
  **second** REPLO user for per-user scoping.
- **M5 — harden.** Token/client store → Mongo, short-lived tokens + refresh rotation, tidy
  logging/errors, run the security checklist.

**Current milestone: M0 ✅ done** — `packages/mcp` scaffolded (ESM, express 5, zod 4,
SDK 1.30), stateless Streamable HTTP `/mcp` server with a `ping` tool; verified via curl
(`initialize`, `tools/list`, `tools/call`). Next: M1 (the engine).

## Out of scope (v1)

Live-session control (`start_workout`/`log_set`/`finish_workout`), routine update/delete,
favorites, MCP **prompts**, delegating the AS to a managed IdP, promoting the AS into `api/`.
