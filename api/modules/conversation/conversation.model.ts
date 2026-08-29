import mongoose from "mongoose";

// A proposed exercise on a proposal turn.
const ProposedExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: String, required: true },
    name: { type: String, default: "" },
    primaryMuscleGroups: { type: [String], default: [] },
    sets: {
      type: [
        new mongoose.Schema(
          { reps: { type: Number, required: true }, weight: { type: Number, required: true } },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { _id: false },
);

// One turn. Text turns use role/content; a proposal turn also carries a card
// payload + its lifecycle status (addressed by proposalId). No _id — messages
// are only ever accessed via their parent.
const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    proposalId: { type: String },
    proposal: {
      type: new mongoose.Schema(
        {
          name: { type: String, required: true },
          description: { type: String },
          tags: { type: [String], default: [] },
          exercises: { type: [ProposedExerciseSchema], default: [] },
        },
        { _id: false },
      ),
    },
    status: { type: String, enum: ["pending", "accepted", "dismissed"] },
    routineId: { type: String },
  },
  { _id: false },
);

// One active conversation per user (most-recent wins). `summary` is reserved
// for the later summarisation milestone and is unused for now.
const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messages: { type: [MessageSchema], default: [] },
    lastActiveAt: { type: Date, default: Date.now },
    summary: { type: String, default: "" },
  },
  { timestamps: true },
);

// Resolve a user's active conversation most-recent-first.
ConversationSchema.index({ userId: 1, lastActiveAt: -1 });

export const ConversationModel = mongoose.model(
  "Conversation",
  ConversationSchema,
);
