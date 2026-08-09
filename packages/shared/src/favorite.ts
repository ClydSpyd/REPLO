import { z } from 'zod';

/** The `POST /favorite` request body — shared by the API and any MCP tooling. */
export const CreateFavoriteSchema = z.object({
  routine: z
    .string({ error: 'Routine ID is required' })
    .min(1, 'Routine ID is required'),
});

export type CreateFavoriteInput = z.infer<typeof CreateFavoriteSchema>;
