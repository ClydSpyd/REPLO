import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { UserMetricsService } from "../../userMetrics/userMetrics.service";

const service = new UserMetricsService();

export const createAnalyzeTrainingPeriodTool = (userId: string) => betaZodTool({
  name: "analyze_training_period",
  description:
    "Produce a combined analytics snapshot of the user's recent training: total & " +
    "series volume, muscle-group balance, the 8-week/28-day volume trend, and personal " +
    "bests. Defaults to the past week. Use for questions like 'how was my week?', " +
    "'am I neglecting a muscle group?', or 'what are my PRs?'.",
  inputSchema: z.object({
    period: z
      .enum(["week", "month"])
      .optional()
      .describe("Analysis window (default 'week')"),
  }),
  run: async ({ period }) => {
    const p = period ?? "week";
    const [volume, muscleBalance, volumeTrend, personalBests] =
      await Promise.all([
        service.getVolume(userId, p),
        service.getMuscleBalance(userId, p),
        service.getVolumeTrend(userId),
        service.getPersonalBests(userId),
      ]);
    return JSON.stringify({
      period: p,
      volume,
      muscleBalance,
      volumeTrend,
      personalBests,
    });
  },
});
