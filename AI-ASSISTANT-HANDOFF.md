# In-app AI Assistant ("Coach") — hand-off

> **Seeding a fresh session:** point Claude at this file. It contains everything
> needed to start building **v1** without re-deriving: the locked decisions, the
> backend + frontend spec, the exact Claude-API usage, which existing code to
> reuse, the build order, and the gotchas. Companion: the MCP server
> (`packages/mcp`) already exposes the same capabilities to *external* clients —
> this is the *internal* surface and shares the service layer + `@replo/shared`
> schemas.

Status: **planned, not started.** Nothing below is built yet.

---

## What we're building

An **in-app AI coach** rendered in REPLO's own UI (the app embeds Claude). It
gives workout advice and analyzes training over the user's real data.

**v1 is deliberately read-only** — advise / analyze / explain / query history, no
mutations. Routine create/edit is **v2** (spec at the end).

### Locked decisions (from planning)
- **Capabilities v1:** read-only.
- **UI:** a **global chat drawer** available on every page (not a dedicated page).
- **Delivery:** **token streaming over SSE**.
- **Architecture:** **direct tool use in the REPLO backend** — the api calls the
  Claude API with tools whose handlers call the existing service classes
  directly, scoped to `req.user.id`. **Not** the MCP connector (the user is
  already authenticated in the app; no OAuth/extra hop needed).
- **Model:** `claude-opus-4-8`, adaptive thinking.

---

## Architecture

```
Coach drawer (React) ──fetch+SSE──▶ POST /api/assistant/chat  (authMiddleware → req.user.id)
   │ tokens render live                    │
   │                                       ▼  Claude API tool-runner (streaming)
   │                              betaZodTool handlers → WorkoutService / UserMetricsService /
   │                                                     RoutineService / ExerciseService (as user)
   └── read-only: no writes, no confirm step in v1
```

---

## Backend — new module `api/modules/assistant/`

Follow the repo's `routes → controller → service` pattern; mount the router in
`api/app.ts` alongside the other `/api/*` routers.

- **`assistant.routes.ts`** — `POST /assistant/chat`, behind `authMiddleware`.
- **`assistant.controller.ts`** — SSE headers (`Content-Type: text/event-stream`,
  `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`),
  `res.flushHeaders()`; read `{ messages }` from the body; delegate to the
  service; write SSE events; end on completion. If a `compression()` middleware
  exists, exclude this route.
- **`assistant.service.ts`** — the core (see Claude-API section for exact calls).

### Tools (v1, all read-only) — `betaZodTool`, handlers scoped to `userId`

| tool | handler → service | REPLO source |
|---|---|---|
| `search_exercises` | `ExerciseService.searchByText(query)` | `GET /api/exercise/search` |
| `list_sessions` | `WorkoutService.getUserWorkouts(userId)` (filter/trim in handler) | `GET /api/workout/mine` |
| `get_session` | `WorkoutService.getWorkout(id, userId)` | `GET /api/workout/:id` |
| `analyze_week` | `UserMetricsService.getVolume(userId,period)` + `getMuscleBalance(userId,period)` + `getVolumeTrend(userId)` + `getPersonalBests(userId)` | `GET /api/userMetrics/*` |
| `list_routines` | `RoutineService.getAllRoutines(userId)` | `GET /api/routine/mine` |

> Reuse the **tuned tool descriptions** from `packages/mcp/src/tools/*.ts` and the
> `@replo/shared` schemas (`MetricsPeriod`, routine field shapes) for tool
> `inputSchema`. ⚠️ **Verify the exact service method signatures** when you start
> (the planning-phase backend explorer failed mid-run; the signatures above are
> from building the MCP server against these same services and are very likely
> correct, but confirm in `api/modules/*/*.service.ts`).

### System prompt (coach persona)
Resolve exercises via `search_exercises` first; general fitness guidance only,
**not medical advice**; stay within the user's REPLO data; **v1 cannot create or
change anything** — if asked to save/build a routine, explain editing is coming
soon and offer the plan as text.

### SSE event protocol (server → client)
`token` `{ text }` · `done` `{}` · `error` `{ message }`. (No `proposal` in v1.)

### Config & deps
- Add `@anthropic-ai/sdk` to `api/package.json`.
- `ANTHROPIC_API_KEY` in `api/.env` (api already uses `dotenv`; `import
  "dotenv/config"` in `api/server.ts`). Server-only — never sent to the client.

---

## Claude API usage (authoritative — from the `claude-api` skill)

- **SDK:** `@anthropic-ai/sdk` (TypeScript). `const client = new Anthropic();`
  (reads `ANTHROPIC_API_KEY`).
- **Model:** `claude-opus-4-8`. **Thinking:** `thinking: { type: "adaptive" }`.
  Do **not** use `budget_tokens` (400 on this model). No `temperature`/`top_p`.
- **Tools via the tool runner** (auto-runs the agentic loop):
  `betaZodTool` from `@anthropic-ai/sdk/helpers/beta/zod` — Zod `inputSchema` +
  an async `run(input)` that returns a string. Then
  `client.beta.messages.toolRunner({ model, max_tokens: 64000,
  thinking: {type:"adaptive"}, tools, messages, stream: true })`.
- **Streaming shape:** the runner (with `stream: true`) yields one message-stream
  per iteration; iterate the outer runner, then inner stream events. Forward
  `content_block_delta` → `text_delta` text to the client as `token` SSE events
  (or use `stream.on("text", …)`). See
  `typescript/claude-api/streaming.md` + `tool-use.md` in the skill for the exact
  event loop.
- Streaming is required (tool use + long replies); `max_tokens: 64000` for
  streaming.
- Cheap/simple turns could later route to `claude-haiku-4-5` — a cost lever, not
  v1.

---

## Frontend — `web/`

- **Streaming client** `src/api/assistant.ts` — **raw `fetch`** (axios can't
  stream and `src/api/index.tsx`'s interceptor won't apply to fetch). POST to
  `/api/assistant/chat`; set `Authorization: Bearer` from
  `localStorage['access_token']` manually; read the `ReadableStream`, parse SSE,
  invoke `onToken` / `onDone` / `onError`.
- **Coach store** `src/stores/coach-store.tsx` (Zustand, mirror
  `src/stores/workout-store.tsx`) — `messages[]`, streaming status, open/closed.
  A store (not local view state) because the drawer is **global** and must
  survive navigation.
- **Drawer** `src/components/ui/CoachDrawer.tsx` — portal + backdrop slide-in,
  reuse the **`src/components/ui/MobileNavSheet.tsx`** pattern
  (`animate-sheet-panel`, `useOutsideClick`, Escape, scroll-lock). Mount in
  `src/components/utility/ProtectedLayout.tsx`; add a trigger button in
  `src/components/ui/ViewHeader.tsx` (next to the account dropdown / rest-timer).
- **Markdown:** add `react-markdown` (+ `remark-gfm`); style with existing
  Tailwind tokens (`var(--text-strong)`, etc.). Errors via existing `useToast()`
  (`src/context/toast.tsx`).

---

## Reuse map (don't rebuild)

| Need | Existing |
|---|---|
| Tool handlers | `api/modules/{workout,userMetrics,routine,exercise}/*.service.ts` |
| Tool input schemas | `@replo/shared` (`MetricsPeriod`, `createRoutineFields`, `routineExerciseFields`, `routineSetFields`) |
| Tool descriptions | `packages/mcp/src/tools/*.ts` |
| Auth → user id | `api/middleware/auth.middleware.ts` → `req.user.{id,email}` |
| Router mount + SPA fallback | `api/app.ts` (SPA fallback only catches non-`/api` GET) |
| Drawer pattern | `web/src/components/ui/MobileNavSheet.tsx` |
| Shell / header | `web/src/components/utility/ProtectedLayout.tsx`, `web/src/components/ui/ViewHeader.tsx` |
| Store pattern | `web/src/stores/workout-store.tsx` |
| Toasts / theme | `web/src/context/toast.tsx`, `web/src/context/theme.tsx` |
| Auth token | `localStorage['access_token']` (see `web/src/api/index.tsx`) |

---

## Build phases

1. **Backend read-only loop (curl-verifiable):** `assistant` module + read tools +
   streaming endpoint + system prompt + `ANTHROPIC_API_KEY`. No UI yet.
2. **Frontend drawer + streaming:** streaming client, `coach-store`, drawer shell
   + header trigger, markdown; text chat working end to end.
3. **Polish:** guardrails, error/toast paths, mobile layout, empty/loading states.

---

## Verification (end to end)

- **Backend:** with a test user's bearer token, `curl -N POST
  /api/assistant/chat` streaming a message → `token` events; "analyze my week"
  reflects that user's real metrics; "how's my bench progressing?" is grounded in
  `list_sessions`/`get_session`.
- **Frontend:** open the drawer from the header on any page → stream a reply,
  rendered as markdown.
- **Isolation:** two accounts each see only their own data.
- **Read-only check:** "create/save a routine" → it declines and offers a text
  plan (no DB change).
- **Deploy note:** SSE must not be buffered by a proxy — confirm streaming works
  on Render (`X-Accel-Buffering: no` + no compression on the route). `POST` isn't
  affected by the SPA fallback.

---

## Gotchas

- **Streaming + tool-runner + SSE** is the trickiest integration. If ordering
  control gets awkward, drop to the **manual streaming agentic loop**
  (`client.messages.stream()` + `finalMessage()` per iteration — pattern in the
  skill's `tool-use.md`).
- **axios won't stream** and its interceptor won't cover a raw `fetch` — attach
  the bearer token manually in `src/api/assistant.ts`.
- **No markdown renderer / no streaming anywhere in the app yet** — both are
  greenfield; `react-markdown` is a new dep.
- **Confirm service signatures** before wiring tools (backend explorer failed
  mid-run during planning).

---

## v2 (deferred) — write capability via the proposal pattern

Add `propose_routine` / `propose_routine_edit` tools that **validate slugs and
return a payload without writing** (use `exerciseExists` from
`api/modules/exercise/exercise.utils.ts`). Emit a `proposal` SSE event; the client
renders a **confirm card**; on tap it persists through the **existing** routine
mutation (`web/src/api` `API.routine` + `web/src/mutations/*`, with optimistic
cache + toast). This keeps the agentic loop idempotent even once writes exist.
```
