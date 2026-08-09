/**
 * Standalone sanity check for ReploClient — NOT part of the MCP server.
 * Run with: npm run smoke -w @replo/mcp   (needs the REPLO api running + a
 * real user's REPLO_EMAIL / REPLO_PASSWORD in packages/mcp/.env)
 *
 * Note the ".js" import extension: this is an ESM (NodeNext) package, so TS
 * relative imports must reference the compiled ".js" path even from a ".ts"
 * file. `tsx` maps it back to the .ts source at runtime.
 */
import "dotenv/config";
import { ReploClient } from "./upstream/reploClient.js";

const client = new ReploClient({
  baseUrl: process.env.REPLO_API_URL ?? "http://localhost:6969",
  email: process.env.REPLO_EMAIL ?? "",
  password: process.env.REPLO_PASSWORD ?? "",
});

async function main() {
  console.log(`Logging in as ${process.env.REPLO_EMAIL} ...`);
  await client.login();
  console.log("✓ logged in");

  const bench = await client.searchExercises("bench");
  console.log(`searchExercises("bench") → ${bench.length} result(s)`);
  console.log("  first:", JSON.stringify(bench[0])?.slice(0, 180));

  const workouts = await client.getMyWorkouts();
  console.log(`getMyWorkouts() → ${workouts.length} session(s)`);
  if (workouts[0]) {
    const w = workouts[0];
    console.log(
      `  e.g. "${w.name}" | started ${w.started} | ${w.exercises?.length ?? 0} exercise(s)`,
    );
  }

  const vol = await client.getVolume("week");
  console.log("getVolume('week') →", JSON.stringify(vol).slice(0, 200));
}

main().catch((err) => {
  console.error("SMOKE FAILED:", err);
  process.exit(1);
});
