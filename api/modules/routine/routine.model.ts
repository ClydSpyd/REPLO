import mongoose from "mongoose";

const RoutineExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: String, required: true }, // slug FK into the exercise catalog (resistance_exercises_base.json)
    sets: [{ reps: Number, weight: Number }],
  },
  { _id: false }
);

const RoutineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    exercises: { type: [RoutineExerciseSchema], required: true },
    tags: { type: [String], required: true },
    description: { type: String, default: "" },
    // Stamped whenever a workout is started from this routine. System-managed —
    // not accepted from client payloads.
    lastPerformed: { type: Date, default: null },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }
  },
  { timestamps: true },
);

export const RoutineModel = mongoose.model(
  "Routine",
  RoutineSchema
);
