# REPLO

A workout tracker for logging resistance training: build reusable routines, run
live sessions set by set, and review what you've done.

The repo is a single npm workspace holding the Express API and the React client.
In production one Express process serves both, so there is no cross-origin
traffic and no API base URL to configure.

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
└── web/                 @replo/web — React client
    └── src/
        ├── views/       page-level components
        ├── components/  shared UI
        ├── queries/     TanStack Query read hooks
        ├── mutations/   TanStack Query write hooks
        └── api/         axios client + endpoint methods
```

---

## Getting started

Requires **Node 20.x** and a MongoDB connection string.

```bash
npm install
```

Create `api/.env`:

```
MONGO_URI=mongodb+srv://…
JWT_SECRET=…
REFRESH_SECRET=…
PORT=6969          # optional, defaults to 6969
```

```bash
npm run dev        # API + client together
npm run dev:api    # API only  → :6969
npm run dev:web    # client only → :5173
```

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Both apps, colour-prefixed output |
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
| Environment | `MONGO_URI`, `JWT_SECRET`, `REFRESH_SECRET` |

`--include=dev` matters: `tsc` and `vite` are devDependencies and the build
fails without them. Don't set `PORT` — the platform injects it.

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

---