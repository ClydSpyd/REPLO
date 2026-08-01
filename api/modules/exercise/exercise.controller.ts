// Controller for exercise module
import { NextFunction, Request, Response } from "express";
import { ExerciseService } from "./exercise.service";

const exerciseService = new ExerciseService();
export const getAllExercises = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(exerciseService.getAllExercises());
  } catch (error) {
    next(error);
  }
};

export const getExerciseById = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params as { id: string };
  if (!id) {
    return res.status(400).json({ message: "Exercise ID is required" });
  }

  try {
    const exercise = exerciseService.getExerciseById(id);
    res.json(exercise);
  } catch (error) {
    next(error);
  }
};

export const searchByText = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { query } = req.query as { query: string };

  if (!query) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const exercises = exerciseService.searchByText(query);
    res.json(exercises);
  } catch (error) {
    next(error);
  }
};

export const getMinimalData = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const exercises = exerciseService.getMinimalData();
    res.json(exercises);
  } catch (error) {
    next(error);
  }
};
