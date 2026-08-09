import { z } from 'zod';

/**
 * The `POST /routine` request body — the single source of truth for the API's
 * request validation and the MCP `create_routine` tool.
 *
 * Fields are exported as raw shapes (not just the assembled schema) so callers
 * that need to decorate individual fields — notably MCP, which layers
 * `.describe()` onto each field to instruct the model — can spread these into
 * their own `z.object` rather than duplicating the rules.
 */
export const routineSetFields = {
  reps: z.number().int().positive('Reps must be a positive integer'),
  weight: z.number().nonnegative('Weight must be a non-negative number'),
};
export const RoutineSetSchema = z.object(routineSetFields);

export const routineExerciseFields = {
  exerciseId: z.string({ error: 'Exercise ID is required' }),
  sets: z.array(RoutineSetSchema),
};
export const RoutineExerciseSchema = z.object(routineExerciseFields);

export const createRoutineFields = {
  name: z
    .string({ error: 'Routine name is required' })
    .min(1, 'Routine name is required'),
  description: z.string().optional(),
  tags: z.array(z.string(), { error: 'At least one tag is required' }),
  exercises: z.array(RoutineExerciseSchema),
};
export const CreateRoutineSchema = z.object(createRoutineFields);

export type CreateRoutineInput = z.infer<typeof CreateRoutineSchema>;
