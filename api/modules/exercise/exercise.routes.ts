// Routes for exercise module
import { Router } from 'express';
import {
  getAllExercises,
  getExerciseById,
  getMinimalData,
  searchByText,
} from "./exercise.controller";

const router = Router();

/** 
 * GET /api/exercises - Get all exercises
 * public route, return all exercises
*/
router.get('/', getAllExercises);

/**
 * GET /api/exercises/dataset
 * public route. Get minimal exercise data for FE autocomplete
 */
router.get('/dataset', getMinimalData);

/** 
 * GET /api/exercises/search?query= 
 * public route. Search exercises by text query
 */
router.get("/search", searchByText);

/** 
 * GET /api/exercises/:id - Get exercise by ID
 * public route, return exercise details for given ID
*/
router.get('/:id', getExerciseById);

export default router;
