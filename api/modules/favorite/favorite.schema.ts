import { z } from "zod";

export const CreateFavoriteSchema = z.object({
  routine: z
    .string({ error: "Routine ID is required" })
    .min(1, "Routine ID is required"),
});
