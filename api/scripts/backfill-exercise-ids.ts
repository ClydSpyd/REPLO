/**
 * One-off migration: backfill `exerciseId` on existing workout and routine
 * exercise entries, then drop the legacy `name` field.
 *
 * Historically the slug id (or the display name) was stored in the `name`
 * field. Since `name` has been removed from the Mongoose schemas, this uses
 * the raw MongoDB driver (which ignores schema/strict mode) so it can still
 * read the legacy `name` to resolve each entry against the exercise catalog.
 *
 * Run:  npx ts-node scripts/backfill-exercise-ids.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db";
import { Exercise } from "../modules/exercise/exercise.types";
import resistanceExercises from "../assets/data/resistance_exercises_base.json";

dotenv.config();

const catalog = resistanceExercises as unknown as Exercise[];
const byId = new Map<string, Exercise>(catalog.map((e) => [e.id, e]));
const byName = new Map<string, Exercise>(
  catalog.map((e) => [e.name.toLowerCase(), e]),
);

/** Resolve a legacy entry: it may hold either the slug id or the display name. */
function resolveId(entry: {
  exerciseId?: string;
  name?: string;
}): string | undefined {
  if (entry.exerciseId) return entry.exerciseId;
  if (!entry.name) return undefined;
  return (byId.get(entry.name) ?? byName.get(entry.name.toLowerCase()))?.id;
}

async function backfill(collectionName: string): Promise<void> {
  const collection = mongoose.connection.collection(collectionName);
  const docs = await collection.find({}).toArray();

  let touchedDocs = 0;
  let updatedEntries = 0;
  const unresolved = new Set<string>();

  for (const doc of docs) {
    const exercises = (doc.exercises ?? []) as Array<{
      exerciseId?: string;
      name?: string;
      [key: string]: unknown;
    }>;
    let changed = false;

    const rewritten = exercises.map((entry) => {
      const id = resolveId(entry);
      if (!id) {
        if (entry.name) unresolved.add(entry.name);
        return entry; // leave untouched so nothing is lost
      }
      if (entry.exerciseId !== id || "name" in entry) {
        changed = true;
        updatedEntries += 1;
      }
      const { name, ...rest } = entry; // drop legacy name
      return { ...rest, exerciseId: id };
    });

    if (changed) {
      await collection.updateOne(
        { _id: doc._id },
        { $set: { exercises: rewritten } },
      );
      touchedDocs += 1;
    }
  }

  console.log(
    `[${collectionName}] docs updated: ${touchedDocs}/${docs.length}, entries backfilled: ${updatedEntries}`,
  );
  if (unresolved.size > 0) {
    console.warn(
      `[${collectionName}] ${unresolved.size} unresolved name(s) (left untouched):`,
      [...unresolved],
    );
  }
}

async function main() {
  await connectDatabase();
  try {
    await backfill("workouts");
    await backfill("routines");
  } finally {
    await mongoose.disconnect();
    console.log("Done. Mongo disconnected.");
  }
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
