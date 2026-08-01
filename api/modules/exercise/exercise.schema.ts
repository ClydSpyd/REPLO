// Schema for exercise module (if needed for validation)
import { z } from 'zod';

export const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  equipment: z.string(),
});
