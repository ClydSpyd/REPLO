import mongoose from "mongoose";

// One text turn. No _id — messages are only ever accessed via their parent.
const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
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
