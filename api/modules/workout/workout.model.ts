import mongoose from "mongoose";

const SetSchema = new mongoose.Schema(
  {
    reps: { type: Number, required: true },
    weight: { type: Number, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const ExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: String }, // slug FK into the exercise catalog (resistance_exercises_base.json)
    // name: { type: String, required: true },
    sets: { type: [SetSchema], required: true },
  },
  { _id: false }
);

const WorkoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, default: "Untitled Workout" },
    started: { type: Date, default: null },
    ended: { type: Date, default: null },
    notes: { type: String, default: "" },
    tags: { type: [String], default: [] },
    location: { type: String, default: "" },
    exercises: { type: [ExerciseSchema], required: true },
    baseRoutine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Routine",
      default: null,
    },
  },
  { timestamps: true },
);

export const WorkoutModel = mongoose.model(
  "Workout",
  WorkoutSchema
);
