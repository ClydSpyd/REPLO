import express from "express";
import fs from "fs";
import path from "path";
import workoutRoutes from "./modules/workout/workout.routes";
import routineRoutes from "./modules/routine/routine.routes";
import favoriteRoutes from "./modules/favorite/favorite.routes";
import userRoutes from "./modules/user/user.routes";
import exerciseRoutes from "./modules/exercise/exercise.routes";
import userMetricsRoutes from "./modules/userMetrics/userMetrics.routes";
import { errorHandler } from "./middleware/error.middleware";

/**
 * Static assets served alongside the API. Resolved from this file rather than
 * the working directory, so it holds in both modes:
 *   - dev  (ts-node from api/)      → api/public       (docs + landing page)
 *   - prod (node from api/dist/)    → api/dist/public  (the built web client)
 * The web build writes into the latter, so a deployment serves the SPA and the
 * API from a single origin — no CORS, no API base URL to configure.
 */
const CLIENT_DIR = path.join(__dirname, "public");

/**
 * The API's own static assets (docs page, landing page) always live in
 * api/public — they aren't compiled, so in production they sit one level up
 * from the running code rather than beside it.
 */
const API_PUBLIC_DIR = fs.existsSync(path.join(__dirname, "public", "docs.html"))
  ? path.join(__dirname, "public") // dev: api/public
  : path.join(__dirname, "..", "public"); // prod: api/dist → api/public

export function createServer() {
  const app = express();
  app.use(express.json());

  app.use(express.static(CLIENT_DIR));

  // API routes
  app.use("/api/workout", workoutRoutes);
  app.use("/api/routine", routineRoutes);
  app.use("/api/favorite", favoriteRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/exercise", exerciseRoutes);
  app.use("/api/userMetrics", userMetricsRoutes);

  // API documentation route
  app.get("/api/docs", (req, res) => {
    res.sendFile(path.join(API_PUBLIC_DIR, "docs.html"));
  });

  /**
   * SPA fallback: hand any non-API GET to index.html so client-side routes
   * survive a refresh or a deep link (e.g. /workout/:id). The negative
   * lookahead keeps unmatched /api paths falling through to a real 404 rather
   * than silently returning HTML.
   */
  app.get(/^(?!\/api(\/|$)).*/, (req, res, next) => {
    const indexFile = path.join(CLIENT_DIR, "index.html");
    if (!fs.existsSync(indexFile)) return next();
    res.sendFile(indexFile);
  });

  // Global error handler
  app.use(errorHandler);
  return app;
}
