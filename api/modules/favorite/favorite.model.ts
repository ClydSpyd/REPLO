import mongoose from "mongoose";

/**
 * A user's favorite marking on a routine. Routines are user-owned but publicly
 * readable, so a user may favorite their own routines or anyone else's — hence a
 * dedicated join collection rather than a field on the routine or an array on the
 * (deliberately lean) user document, matching the Workout/UserMetrics convention.
 */
const FavoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    routine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Routine",
      required: true,
    },
  },
  { timestamps: true },
);

// One favorite per (user, routine) pair — makes favoriting idempotent and lets
// the service lean on a duplicate-key error rather than a read-then-write race.
FavoriteSchema.index({ userId: 1, routine: 1 }, { unique: true });

export const FavoriteModel = mongoose.model("Favorite", FavoriteSchema);
