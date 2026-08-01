import { z } from "zod";


export const CreateRoutineSchema = z.object({
  name: z
    .string({
      error: "Routine name is required",
    })
    .min(1, "Routine name is required"),
  description: z.string().optional(),
  tags: z.array(z.string(), { error: "At least one tag is required" }),
  exercises: z.array(
    z.object({
      exerciseId: z.string({ error: "Exercise ID is required" }),
      sets: z.array(
        z.object({
          reps: z.number().int().positive("Reps must be a positive integer"),
          weight: z
            .number()
            .nonnegative("Weight must be a non-negative number"),
        }),
      ),
    }),
  ),
});