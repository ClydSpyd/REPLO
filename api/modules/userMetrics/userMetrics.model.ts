import mongoose from "mongoose";

const UserMetricsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  weight: Number,
  bmi: Number,
  bodyFat: Number,
  personalBests: { type: Map, of: Number }, // Record<string, number>
});

export const UserMetricsModel = mongoose.model("UserMetrics", UserMetricsSchema);
