/**
 * ReploClient — the single seam between the MCP server and REPLO's REST API.
 * tool calls go through here - auth, error handling, and URL building live in one place. 
 */

import type { CreateRoutineInput } from "@replo/shared";

// "week" | "month" — the period accepted by the metrics endpoints.
export type MetricsPeriod = "week" | "month";

export interface ReploClientOptions {
  baseUrl: string; // e.g. http://localhost:6969
  email?: string;
  password?: string;
  /**
   * If set, the client uses this REPLO JWT (Token B) directly and never logs
   * in — this is how a per-request client acts as the authenticated OAuth user.
   */
  accessToken?: string;
}

/** thrown when an upstream REPLO call fails; carries the HTTP status. */
export class ReploError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ReploError";
  }
}

/** trimmed workout shape — only the fields our tools actually read. */
export interface WorkoutTrimmed {
  _id: string;
  name: string;
  started: string | null;
  ended: string | null;
  exercises: Array<{
    exerciseId?: string;
    name?: string;
    sets: Array<{ reps: number; weight: number; completed?: boolean }>;
  }>;
}

export interface Routine {
  _id: string;
  name: string;
  description: string;
  exercises: Record<string, any>[];
  tags: string[];
  lastPerformed?: Date;
  user: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for creating a routine. Sourced from the shared CreateRoutineSchema
 * (@replo/shared) so it can't drift from what the API validates.
 */
export type CreateRoutinePayload = CreateRoutineInput;

type RequestOptions = {
  auth?: boolean;
  query?: Record<string, string | undefined>;
  body?: unknown;
  _retried?: boolean;
};

export class ReploClient {
  private accessToken: string | null = null;

  constructor(private readonly opts: ReploClientOptions) {
    // A per-request client is handed the user's REPLO JWT directly — no login.
    this.accessToken = opts.accessToken ?? null;
  }

  /** Log in and cache the access token (Token B in the plan's two-token model). */
  async login(): Promise<string> {
    if (this.opts.accessToken) return this.opts.accessToken;
    if (!this.opts.email || !this.opts.password) {
      throw new ReploError(401, "No credentials available to log in");
    }
    const res = await fetch(`${this.opts.baseUrl}/api/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: this.opts.email,
        password: this.opts.password,
      }),
    });
    if (!res.ok) {
      throw new ReploError(res.status, `Login failed (${res.status})`);
    }
    const data = (await res.json()) as { accessToken: string };
    this.accessToken = data.accessToken;
    return data.accessToken;
  }

  private async ensureToken(): Promise<string> {
    return this.accessToken ?? (await this.login());
  }

  /**
   * Core request helper. Builds the URL + query, attaches the bearer token when
   * `auth` is set, and — because REPLO access tokens expire — re-logs in once
   * and retries on a 401.
   */
  private async request<T>(
    method: string,
    path: string,
    opts: RequestOptions = {},
  ): Promise<T> {
    const url = new URL(`${this.opts.baseUrl}${path}`);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, v);
    }

    const headers: Record<string, string> = { Accept: "application/json" };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.auth) headers.Authorization = `Bearer ${await this.ensureToken()}`;

    const res = await fetch(url, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    // Token-bound (per-request) clients can't re-login, so only retry the
    // login-and-retry dance when we actually hold our own credentials.
    if (
      res.status === 401 &&
      opts.auth &&
      !opts._retried &&
      !this.opts.accessToken
    ) {
      this.accessToken = null; // force a fresh login, then retry once
      return this.request<T>(method, path, { ...opts, _retried: true });
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // TEMP DIAGNOSTIC: exactly what we sent upstream and what came back.
      const authPrefix = headers.Authorization
        ? headers.Authorization.slice(0, 16)
        : "(none)";
      console.error(
        `[replo-mcp] upstream ${method} ${url.href} -> ${res.status} | auth=${authPrefix}… | body=${text.slice(0, 200)}`,
      );
      throw new ReploError(
        res.status,
        `${method} ${path} → ${res.status}: ${text.slice(0, 200)}`,
      );
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  // ----- reads (public endpoints) -----

  /** Search the exercise catalog by name / muscle group / alias. */
  searchExercises(query: string): Promise<unknown[]> {
    return this.request("GET", "/api/exercise/search", { query: { query } });
  }

  /** The static exercise catalog (autocomplete slice) — backs the MCP resource. */
  getExerciseCatalog(): Promise<unknown[]> {
    return this.request("GET", "/api/exercise/dataset");
  }

  // ----- reads (auth-gated, scoped to the logged-in user) -----

  getMyWorkouts(): Promise<WorkoutTrimmed[]> {
    return this.request("GET", "/api/workout/mine", { auth: true });
  }

  getMyRoutines(): Promise<Routine[]> {
    return this.request("GET", "/api/routine/mine", { auth: true });
  }

  getWorkout(id: string): Promise<unknown> {
    return this.request("GET", `/api/workout/${encodeURIComponent(id)}`, {
      auth: true,
    });
  }

  getVolume(period: MetricsPeriod): Promise<unknown> {
    return this.request("GET", "/api/userMetrics/volume", {
      auth: true,
      query: { period },
    });
  }

  getMuscleBalance(period: MetricsPeriod): Promise<unknown> {
    return this.request("GET", "/api/userMetrics/muscle-balance", {
      auth: true,
      query: { period },
    });
  }

  getVolumeTrend(): Promise<unknown> {
    return this.request("GET", "/api/userMetrics/volume-trend", { auth: true });
  }

  getPersonalBests(): Promise<unknown> {
    return this.request("GET", "/api/userMetrics/personal-bests", {
      auth: true,
    });
  }

  // ----- writes -----

  createRoutine(body: CreateRoutinePayload): Promise<unknown> {
    return this.request("POST", "/api/routine", { auth: true, body });
  }

  editRoutine(
    id: string,
    body: Partial<CreateRoutinePayload>,
  ): Promise<unknown> {
    return this.request("PATCH", `/api/routine/${encodeURIComponent(id)}`, {
      auth: true,
      body,
    });
  }
}
