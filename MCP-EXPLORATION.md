# MCP Exploration — Workout Tracker

Working notes for exploring Model Context Protocol integration. Deliberately kept
separate from day-to-day app development.

> **Seeding a new session:** point Claude at this file. It contains enough context
> to pick up cold — the app's shape, the decisions that bear on MCP, and where the
> discussion left off.

---

## The app, in brief

Three parts under `workout_tracker/` (the root is **not** a git repo; `api/` and
`web_app/` are separate repos):

- **`api/`** — Node/Express + TypeScript + MongoDB (Mongoose). Layered modules:
  `routes → controller → service → repository → model`, with zod validation in
  some modules. Mounted under `/api/workout`, `/api/routine`, `/api/user`,
  `/api/exercise`. See `api/README.md` for the full module breakdown.
- **`web_app/`** — React 19 + Vite + TanStack Query + Tailwind.
- **`mobile_app/`** — Flutter, currently dormant.

## Decisions already made that bear on MCP

These aren't incidental — each one changes what an MCP integration would look like.

**1. Exercises are referenced, not embedded.**
The exercise catalog is a static JSON dataset (`api/assets/data/resistance_exercises_base.json`,
~121 entries, slug ids like `barbell-bench-press`) — not a Mongo collection.
Workout/routine exercise entries store only `exerciseId` + `sets`; the display
name is not persisted. Catalog metadata (name, muscle groups, equipment) is
attached **at read time** via an in-memory `Map` lookup.

*Why it matters for MCP:* workout reads already come back enriched with muscle
groups, so analytical questions ("which muscle groups have I neglected?") are
answerable from a single tool call — no client-side join, no stale copies.
It also makes the catalog a natural read-only **resource**.

**2. Auth is JWT bearer.**
`POST /api/user/login` returns an access/refresh token pair; `authMiddleware`
verifies the bearer token and attaches `req.user`. All workout/routine routes are
auth-gated and scoped to the authenticated user.

**3. Mutating workout endpoints return the full enriched workout.**
Not just the changed fragment. Good for clients replacing cached state; also means
a single tool call can return complete post-action state.

**4. One active workout per user.**
Enforced server-side — a second concurrent start returns 409. `GET /workout/active`
returns the ongoing session or null.

---

## Discussion so far

### What MCP is

An open standard for letting an LLM discover and call capabilities outside itself.
Mental model: **a typed, self-describing adapter layer between a model and your
system.** The capabilities already exist as REST endpoints; MCP is a contract that
describes them so a model can find them, understand *when* to use them, and call
them without hand-written prompt glue.

### Two directions — decide this first

| | App as **MCP server** | App as **MCP client** |
|---|---|---|
| Who calls whom | Claude (Desktop, Code, etc.) calls *your* API | *Your app* embeds Claude, which calls external MCP servers |
| What you build | Thin server describing endpoints as tools | Chat surface + Claude API integration |
| UX | "Claude, log 3×8 bench at 80kg" — from outside the app | In-app coach that can also reach Strava, Google Fit, … |
| Effort | Low — the API already exists | High — a whole product surface |

### The three MCP primitives, mapped

- **Tools** — model-callable actions with side effects → the mutation endpoints
  (start workout, add exercise, log set, end session, save routine).
- **Resources** — read-only context → the static exercise catalog.
- **Prompts** — user-invoked templates → skip initially.

### The main design insight: REST endpoints ≠ good tools

~20 endpoints wrapped naively produces 20 tools, which is usually **worse** than
6 well-chosen ones. Endpoints assume a programmer who knows the sequence; tools
are consumed by a model deciding what to do from one sentence.

Example: "log 3 sets of bench at 80kg" against the current API is
*find active workout → verify exercise → add exercise → add set ×3* — five or six
round trips, each a chance to go wrong. A single `log_sets(exercise, sets[])`
doing it all server-side is far more reliable.

**Tools should be task-shaped, not resource-shaped.**

Corollary: tool *descriptions* carry the load. Being prescriptive about **when**
to call beats describing what it does — "Call this when the user reports
completing sets during a live session" > "Adds a set to an exercise."

### The hard part: auth

The model must **never** handle a password — a `login(email, password)` tool is
not an option. Realistic range:

- **Personal access token** pasted into the MCP client config — fine for a single
  user, unshippable as a product.
- **Proper OAuth** — correct, considerably more work.

Start with the former for a personal tool.

### Recommendation

Expose the tracker as an **MCP server** with a deliberately small tool surface —
roughly `get_active_workout`, `log_sets`, `search_exercises`, `get_training_history`
— plus the exercise catalog as a resource. Personal-token auth to begin.

That yields conversational access to your own training data ("what's my bench
progression?", "start today's push session") — the thing an LLM is good at and the
web UI is bad at — for about a weekend of work rather than a rewrite.

Worth knowing: the Claude API has a native MCP connector, so a hosted MCP server
is callable from Claude directly without building any client. That's what makes
the server direction cheap.

---

## Open question — where to go next

Pick one:

1. **Tool surface design** — nail down the exact tool list, signatures, and
   descriptions.
2. **Auth flow** — personal token vs OAuth, and what the server needs either way.
3. **Transport & hosting** — stdio vs streamable HTTP, and where this would run.

## Not yet discussed

- Whether the MCP server lives inside `api/` or as a separate service
- Multi-user vs single-user assumptions
- Anything about the dormant Flutter client
