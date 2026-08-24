### Design Principles

- **Separation of concerns** — each layer has one responsibility  
- **High cohesion** — all module-specific code lives together  
- **Low coupling** — layers depend only on what they need  
- **Scalable structure** — easy to extend with auth, analytics, caching, etc.  

This structure keeps the codebase maintainable, testable, and production-ready.

## Module Architecture

Modules follow a layered, feature-based architecture.  
Each file has a single, clear responsibility:

| File | Responsibility |
|------|---------------|
| `[module].routes.ts`      | Maps HTTP routes (URLs) to controller functions
| `[module].controller.ts`  | Handles the HTTP layer (request/response logic)
| `[module].service.ts`     | Contains business logic and domain rules
| `[module].repository.ts`  | Handles database access and queries
| `[module].model.ts`       | Defines the MongoDB schema (Mongoose model)
| `[module].types.ts`       | Contains TypeScript types and DTO definitions
| `[module].schema.ts`      | Defines zod validation schema for module controller
| `[module].utils.ts`       | Contains helper funtions for module operations

`schema.ts` and `utils.ts` are only present where a module needs them — currently zod schemas
in `routine`, `user` and `exercise`, and helpers in `user` (JWT token pair) and `exercise`
(catalog indexing and enrichment).

Routers are mounted in `app.ts` under `/api/workout`, `/api/routine`, `/api/user` and
`/api/exercise`. `GET /api/docs` serves `public/docs.html`.

The AI coach adds an `/api/assistant` router — see the [Assistant Module](#assistant-module-ai-coach)
below. It's the one module that doesn't own a database collection.

## Exercise Reference Architecture

The exercise catalog is a **static JSON dataset** (`assets/data/resistance_exercises_base.json`),
not a Mongo collection. Workouts and routines therefore **reference** exercises rather than
embedding their metadata:

- Stored on a workout/routine exercise entry: **`exerciseId`** (a stable slug, e.g.
  `barbell-bench-press`) plus its `sets`. The display `name` is **not** persisted.
- Catalog metadata (`name`, `muscleGroups`, `primary`/`secondaryMuscleGroups`, `equipment`, …)
  is attached **at read time** by `enrichExerciseEntry` / `withEnrichedExercises`
  (`modules/exercise/exercise.utils.ts`), which resolves `exerciseId` against an in-memory
  `Map` built once at module load.

**Why:** no duplicated data, no drift, corrections to the catalog propagate to all historical
workouts, and enrichment costs an O(1) lookup with no extra database query.

Workout and routine reads return exercises already enriched, each shaped as
`{ exerciseId, name, sets, exerciseDetails }` — `exerciseDetails` is undefined if the id
can't be resolved.

### Migration

`scripts/backfill-exercise-ids.ts` is a one-off migration that backfills `exerciseId` on
pre-existing workout/routine documents (resolving the legacy `name` field against the catalog)
and drops the legacy `name`. Run with:

```
npx ts-node scripts/backfill-exercise-ids.ts
```

# API Functionalities Overview

## Modules

### Workout Module
Manages live workout sessions. All routes require authentication and are scoped to the
authenticated user; every mutating endpoint returns the **full, enriched workout** so clients
can replace their cached copy directly.

- **Create a workout session (incremental):** Start a new session. Accepts partial data
  (`baseRoutine`, `date`, initial exercises, notes). Creating from a `baseRoutine` copies that
  routine's exercises in with all sets reset to incomplete. Only one **ongoing** workout is
  allowed per user.
- **Update workout session incrementally:** Patch notes, name, metrics or any partial field.
- **Manage exercises within a session:** Add, update, or remove an exercise, matched by
  `exerciseId`.
- **Replace an exercise (preserving sets):** Swap one exercise for another while keeping the
  logged sets intact — only the exercise identity changes.
- **Manage sets within an exercise:** Add, update (by index), or delete individual sets.
- **Fetch the active session:** Retrieve the user's current ongoing workout, if any.
- **Fetch a specific workout:** Retrieve the current state of a workout session by its unique ID.
- **List all workouts for a user:** Get a history of workouts performed by the authenticated user.
- **Delete a workout:** Remove a workout record if needed (e.g., for corrections).

### Routine Module
This module enables users to:
- **Create a workout routine:** Define a fixed set of exercises (with sets/reps/weights) as a
  template for future workouts or for sharing.
- **Fetch a specific routine:** Retrieve the details of a routine by its unique ID, with its
  exercises enriched from the catalog.
- **List all routines:** View all available routines, supporting reference, planning, or
  selection for a workout.
- **List the user's own routines:** Get only the routines created by the authenticated user.
- **Update a routine:** Patch an existing routine (e.g. add/remove exercises).
- **Delete a routine:** Remove a routine template if it is no longer needed.

Creation is validated with zod; update and delete enforce ownership.

### User Module
- **Register and login:** Handles user registration (with bcrypt password hashing) and login
  (issuing a JWT access/refresh token pair). Payloads are validated with zod.
- **Current user:** Returns the authenticated user's profile, resolved from the JWT. The
  password is stripped from query results.
- **User profile:** Stores email, password, username, profile pic, and other profile fields.
- **Repository/service pattern:** Separates database logic from business logic for maintainability.

### UserMetrics Module
- **Track metrics:** Allows users to record weight, BMI, body fat %, and personal bests (flexible keys).
- **History:** Supports historical tracking and analytics for user metrics.
- **Partial updates:** Endpoints accept partial objects for easy metric updates.
- **Repository/service pattern:** Clean separation of DB and business logic.

### Exercise Module
Serves the static exercise catalog. All routes are public and read-only.

- **List all exercises:** Fetch all available resistance exercises from the static data source.
- **Fetch a minimal dataset:** A trimmed projection (`id`, `name`, `equipment`, `muscleGroups`,
  `bodyRegion`) intended to be fetched once and cached client-side, so search/filtering can run
  entirely on the front end without a request per query.
- **Fetch a specific exercise:** Retrieve details of an exercise by its unique ID.
- **Search exercises by text:** Find exercises by name, muscle groups, or aliases using a query
  parameter.
- **Enrichment helpers:** `exercise.utils.ts` indexes the catalog at module load and exposes the
  helpers used by the workout and routine services (see
  [Exercise Reference Architecture](#exercise-reference-architecture)).
- **No database dependency:** All data is served from a static JSON file for fast, read-only
  access — `exercise.model.ts` and `exercise.repository.ts` are intentionally empty placeholders.

### Assistant Module (AI Coach)
Powers the in-app AI coach. Unlike the other modules it owns no data — no model, no
repository. Instead it orchestrates Anthropic Claude and reuses the other modules' services
as the model's tools. It departs from the standard layering on purpose: just `routes →
controller → service`, plus a `tools/` folder.

- **Streaming chat endpoint:** `POST /api/assistant/chat` (auth required) streams the
  assistant's reply as Server-Sent Events. The controller does only SSE plumbing — it emits
  `token { text }` per delta, `done {}` on completion, and `error { message }` on failure —
  while the service owns all Claude interaction. The request body is the running conversation:
  `{ messages: { role: "user" | "assistant", content: string }[] }`.
- **Tool-runner loop:** `assistant.service.ts` runs Claude (`claude-sonnet-5`, adaptive
  thinking) through the SDK's tool-runner, which drives the agentic loop — call the model, run
  any tool it requests, feed the result back, repeat — until the reply is complete. Only text
  deltas are forwarded to the client; thinking and tool-call plumbing stay server-side.
- **Read-only tools (`tools/`):** one file per tool, re-exported from `tools/index.ts`.
  `search_exercises` is global; `list_sessions` and `analyze_training_period` are built
  per-request by `create*Tool(userId)` factories so every data-reading tool is **scoped to the
  authenticated user** (`req.user.id`). Handlers call the existing `ExerciseService`,
  `WorkoutService` and `UserMetricsService` directly.
- **Config & scope:** requires `ANTHROPIC_API_KEY` (server-only). Read-only for now — the coach
  advises and analyses but cannot create or modify workouts or routines.

## Middlewares

### authMiddleware
- Verifies JWT tokens in Authorization header.
- Attaches user info (id, email, etc.) to req.user for downstream access.
- Used to protect routes that require authentication.

### errorHandler
- Catches errors thrown in controllers/routes.
- Logs error details for debugging.
- Sends standardized JSON error responses to the client.
- Reads `err.status` where set (e.g. `400` invalid ID, `409` ongoing workout), defaulting to `500`.

---
