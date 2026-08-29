import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { RoutineService } from "../../routine/routine.service";

export const createReadRoutinesTool = (userId: string) =>
  betaZodTool({
    name: "read_routines",
    description:
      "Read the user's saved routines. Returns a list of routines with their exercises and planned sets.",
    inputSchema: z.object({
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Max routines to return (default 20)"),
    }),
    run: async ({ limit }) => {
      const service = new RoutineService();
      const routines = await service.getAllRoutines(userId);
      const limitedRoutines = routines.slice(0, limit ?? 20);
      return JSON.stringify({ routines: limitedRoutines });
    },
  });