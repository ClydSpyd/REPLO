import express from "express";
import cors from "cors";
import workoutRoutes from "./modules/workout/workout.routes";
import routineRoutes from "./modules/routine/routine.routes";
import userRoutes from "./modules/user/user.routes";
import exerciseRoutes from "./modules/exercise/exercise.routes";
import { errorHandler } from "./middleware/error.middleware";

export function createServer() {
  const app = express();

  app.use(
    cors({
      origin: "*",
      credentials: true,
    }),
  );
  app.use(express.json());

  // Serve static files
  app.use(express.static("public"));

  // API routes
  app.use("/api/workout", workoutRoutes);
  app.use("/api/routine", routineRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/exercise", exerciseRoutes);

  // API documentation route
  app.get("/api/docs", (req, res) => {
    res.sendFile("docs.html", { root: "public" });
  });

  // Global error handler
  app.use(errorHandler);
  return app;
}
