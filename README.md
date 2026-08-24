# REPLO

A workout tracker for logging resistance training: build reusable routines, run
live sessions set by set, and review what you've done.

The repo is an npm-workspaces monorepo holding the Express API, the React
client, a shared types/validation package, and a remote **MCP server** that lets
MCP-capable AI clients (Claude, etc.) reach your training data. In production one
Express process serves the API and client together, so there is no cross-origin
traffic and no API base URL to configure. The MCP server is a separate service —
see [`packages/mcp/README.md`](packages/mcp/README.md).

---

## Features

**Live sessions** — start a workout from scratch or from a saved routine, add
exercises as you go, log each set's reps and weight, swap an exercise without
losing its logged sets, and track elapsed time. Only one session may be active
at a time.

**Routines** — build reusable templates from the exercise library, tag them by
split, duplicate or edit them, and start a session from one in a click. A
finished session can be saved straight back as a routine.

**Exercise library** — 121 resistance exercises with muscle groups, equipment
and movement patterns. Filter by muscle group or search by name; selecting a
consolidated group like *Back* matches everything under it (`lats`,
`upper-back`, `traps`, …).

**AI coach** — an in-app assistant ("Coach", branded **REPLO AI**) in a global
chat drawer on every page. It streams its reply token by token and can read your
data through tools — searching the exercise catalog, listing past sessions, and
analysing a training period — to ground advice in what you've actually done.
Powered by Anthropic Claude; **read-only** for now (it advises, it doesn't write).


## Architecture

```
                    ┌──────────────────────────────┐
  browser  ───────► │  Express (single origin)     │
                    │                              │
                    │   /            → SPA bundle  │
                    │   /api/*       → REST API    │
                    └──────────────┬───────────────┘
                                   │
                              MongoDB (Mongoose)
```

The client is built into the directory the compiled API serves
(`api/dist/public`), so one process hosts both. In development Vite serves the
client on `:5173` and proxies `/api` through to Express on `:6969` — the same
single-origin behaviour, so CORS never applies in either mode.

### Stack

| | |
|---|---|
| **API** | TypeScript, Express 4, Mongoose 7, Zod 4, JWT (`jsonwebtoken`), bcrypt |
| **Client** | TypeScript, React 19, Vite 7, TanStack Query 5, Tailwind 4, React Router 7 |
| **AI** | `@anthropic-ai/sdk`, Anthropic Claude (`claude-sonnet-5`) — powers the in-app coach (`api/modules/assistant`) |
| **MCP** | TypeScript, `@modelcontextprotocol/sdk`, Express 5, OAuth 2.1 — remote MCP server (`packages/mcp`) |
| **Shared** | TypeScript, Zod 4 — schemas + types shared across API, client, and MCP (`packages/shared`) |
| **Tooling** | npm workspaces, `concurrently`, Node 20 |

### Layout

```
REPLO/
├── api/                 @replo/api — Express REST API
│   ├── modules/         one folder per domain (routes → controller → service → repository → model)
│   ├── middleware/      auth + error handling
│   ├── assets/data/     static exercise catalog (JSON)
│   ├── scripts/         one-off migrations
│   └── public/          API landing + docs page
├── web/                 @replo/web — React client
│   └── src/
│       ├── views/       page-level components
│       ├── components/  shared UI
│       ├── queries/     TanStack Query read hooks
│       ├── mutations/   TanStack Query write hooks
│       └── api/         axios client + endpoint methods
└── packages/
    ├── shared/          @replo/shared — Zod schemas + types shared across api, web, and mcp
    └── mcp/             @replo/mcp — remote, OAuth-secured MCP server (see packages/mcp/README.md)
```

---

## Getting started

Requires **Node 20.x** and a MongoDB connection string.

```bash
npm install
```

Create `api/.env` (see [`api/.env.example`](api/.env.example)):

```
MONGO_URI=mongodb+srv://…
JWT_SECRET=…
REFRESH_SECRET=…
PORT=6969          # optional, defaults to 6969

ANTHROPIC_API_KEY=sk-ant-…   # required for the in-app AI coach (server-only)

# Owner signup notifications (optional — omit both to disable)
RESEND_API_KEY=re_…
OWNER_EMAIL=you@gmail.com
NOTIFY_FROM_EMAIL=Replo <onboarding@resend.dev>   # optional, this is the default
```

See [Owner notifications](#owner-notifications) for how to obtain these.

```bash
npm run dev        # API + client together
npm run dev:api    # API only  → :6969
npm run dev:web    # client only → :5173
```

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | API + client, colour-prefixed output |
| `npm run dev:full` | API + client + MCP server together |
| `npm run dev:mcp` | MCP server only |
| `npm run build` | Compiles the API, then builds the client into `api/dist/public` |
| `npm run lint` | Lints the client |
| `npm start -w @replo/api` | Runs the compiled server (production) |

To run a command in one workspace: `npm run <script> -w @replo/web`, or
`npm exec -w @replo/web -- <binary>`.

---

## Deployment

Deploys to Render as a **single Web Service**:

| Field | Value |
|---|---|
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start -w @replo/api` |
| Environment | `MONGO_URI`, `JWT_SECRET`, `REFRESH_SECRET` (+ `RESEND_API_KEY`, `OWNER_EMAIL` for notifications) |

`--include=dev` matters: `tsc` and `vite` are devDependencies and the build
fails without them. Don't set `PORT` — the platform injects it.

---

## Owner notifications

When a new user registers, the app can email the owner. It's built on
[Resend](https://resend.com) and hooked into the register flow in
[`api/lib/notify.ts`](api/lib/notify.ts) — sent **fire-and-forget**, so a mail
outage can never block or fail a signup.

The feature is **off until configured**: if `RESEND_API_KEY` or `OWNER_EMAIL` is
unset, `notifyOwner` no-ops silently (which is why local dev stays quiet).

**To enable it:**

1. Sign up at [resend.com](https://resend.com) using the inbox you want alerts
   at, and create an API key.
2. Set the env vars — locally in `api/.env`, and in the Render service's
   Environment:
   ```
   RESEND_API_KEY=re_…
   OWNER_EMAIL=you@gmail.com
   ```
3. Restart the API. A new signup now emails `OWNER_EMAIL`.

`NOTIFY_FROM_EMAIL` defaults to Resend's shared sender
(`onboarding@resend.dev`), which in test mode **only delivers to the email you
registered with Resend** — fine for owner alerts. To send from your own address
(or email other recipients later), [verify a domain](https://resend.com/domains)
in Resend and set `NOTIFY_FROM_EMAIL` to an address on it.

---

## API capabilities

Base path `/api`. Authenticated routes take `Authorization: Bearer <token>`.
Errors return `{ "error": "message" }`. `GET /api/docs` serves a reference page.

Deeper detail — module architecture, the exercise reference model, migrations —
is in [`api/README.md`](api/README.md).

### Workout — live sessions

All routes require auth and are scoped to the caller. Every mutating endpoint
returns the **complete, enriched workout**, so a client can replace its cached
copy wholesale.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/workout` | Start a session. Pass `baseRoutine` to seed it from a routine (sets copied, all marked incomplete). Returns **409** if one is already active. |
| `PATCH` | `/workout/:id` | Patch name, notes, tags, `started`/`ended` |
| `GET` | `/workout/active` | The in-progress session, or `null` |
| `GET` | `/workout/mine` | Session history |
| `GET` | `/workout/:id` | One session |
| `DELETE` | `/workout/:id` | Remove a session |
| `POST` `PATCH` `DELETE` | `/workout/:id/exercise` | Add, update or remove an exercise (matched on `exerciseId`) |
| `PATCH` | `/workout/:id/exercise/replace` | Swap `fromExerciseId` → `toExerciseId`, **keeping the logged sets** |
| `POST` | `/workout/:id/set` | Append a set |
| `PATCH` `DELETE` | `/workout/:id/set/:idx` | Update or remove a set by index |

### Routine — reusable templates

| Method | Path | Auth | Purpose |
|---|---|:--:|---|
| `GET` | `/routine` | – | All routines |
| `GET` | `/routine/mine` | ✅ | The caller's routines |
| `GET` | `/routine/:id` | – | One routine, exercises enriched |
| `POST` | `/routine` | ✅ | Create (validated with Zod) |
| `PATCH` | `/routine/:id` | ✅ | Update — ownership enforced |
| `DELETE` | `/routine/:id` | ✅ | Delete — ownership enforced |

Starting a workout from a routine stamps its `lastPerformed`.

### User — auth

| Method | Path | Auth | Purpose |
|---|---|:--:|---|
| `POST` | `/user/register` | – | Create an account (bcrypt-hashed), returns a token pair |
| `POST` | `/user/login` | – | Returns an access + refresh token pair |
| `GET` | `/user/me` | ✅ | The caller's profile, password stripped |

### Exercise — static catalog

Public and read-only; served from JSON, no database.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/exercise` | Full catalog |
| `GET` | `/exercise/dataset` | Trimmed projection intended to be fetched once and cached client-side, so search and filtering run entirely in the browser |
| `GET` | `/exercise/search?query=` | Text search over names, muscle groups and aliases |
| `GET` | `/exercise/:id` | One exercise |

### How exercises are stored

Workouts and routines store only a stable slug (`exerciseId`, e.g.
`barbell-bench-press`) plus the sets — never the exercise's name or muscle
groups. That metadata is attached **at read time** from an in-memory index of
the catalog.

So corrections to the catalog propagate to all historical workouts, nothing can
drift, and enrichment costs an O(1) lookup rather than a database join.

### Assistant — AI coach

`POST /api/assistant/chat` (auth required) streams a coach reply as
**Server-Sent Events**. The body is `{ messages: { role, content }[] }` — the full
conversation so far. Events: `token { text }` per delta, `done {}` at the end,
`error { message }` on failure. Requires `ANTHROPIC_API_KEY`.

Server-side it runs an Anthropic Claude tool-runner loop
(`api/modules/assistant`) with read-only tools scoped to the caller —
`search_exercises`, `list_sessions`, `analyze_training_period`.

---

## MCP server

REPLO ships a remote **Model Context Protocol** server (`packages/mcp`,
`@replo/mcp`) — a separate Node service that lets MCP-capable AI clients (Claude
Code / Desktop, etc.) query your training data **as you**, secured with OAuth 2.1.
It doesn't touch the database directly; it calls the existing `/api/*` endpoints,
and each user signs in with their REPLO credentials through the server's own
OAuth login page.

- **Connect:** `claude mcp add --transport http replo https://<mcp-host>/mcp`
- **Tools:** search exercises, list / inspect past sessions, list routines,
  analyze the week's training, and create / edit routines.

Full capabilities, local + hosted setup, environment variables, and the OAuth
flow are documented in [`packages/mcp/README.md`](packages/mcp/README.md).

---

## AI assistant (Coach)

REPLO also has an **in-app** AI assistant — the "Coach" (branded **REPLO AI**) —
rendered directly in the client as a global chat drawer. It's a different surface
from the MCP server, and the two are complementary:

| | Coach (in-app) | MCP server |
|---|---|---|
| Audience | REPLO's own UI | External MCP clients (Claude Desktop/Code) |
| Auth | The user's existing app session (JWT) | OAuth 2.1 sign-in per client |
| How it reaches data | Claude **tool-runner in the API**, calling the domain services directly, scoped to `req.user.id` | Tools that call the public `/api/*` endpoints as the user |
| Delivery | Token streaming over SSE | MCP transport |
| Model | Anthropic Claude (`claude-sonnet-5`, adaptive thinking) | (client's own model) |

Because the user is already authenticated in the app, the Coach needs no extra
OAuth hop — it uses **direct tool use** in the backend rather than the MCP
connector.

**Backend** (`api/modules/assistant`) — a streaming SSE endpoint plus a Claude
tool-runner loop with read-only, user-scoped tools. See
[`api/README.md`](api/README.md#assistant-module-ai-coach).

**Frontend** (`web/src/…/Coach*`) — a floating launcher and slide-in chat drawer
with live token streaming and markdown rendering. See
[`web/README.md`](web/README.md#ai-coach-replo-ai).

Scope today is **read-only**: the Coach can search exercises, review your past
sessions, and analyse a training period, but it does not create or modify
workouts or routines. Requires `ANTHROPIC_API_KEY` (server-only; never sent to
the client).

---