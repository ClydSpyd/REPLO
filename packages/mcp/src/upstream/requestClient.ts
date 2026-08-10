import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { ReploClient } from "./reploClient.js";

// Strip a trailing slash so we never build `https://host//api/...`.
const REPLO_API_URL = (
  process.env.REPLO_API_URL ?? "http://localhost:6969"
).replace(/\/$/, "");

/**
 * Build a ReploClient that acts as the *authenticated user* for this request.
 *
 * requireBearerAuth validated the client's Token A and attached its AuthInfo to
 * the request; the Streamable HTTP transport surfaces that as `extra.authInfo`.
 * When our AS issued Token A it stashed the user's REPLO JWT (Token B) in
 * `authInfo.extra.reploToken` — we pull it back out here so tool calls hit
 * REPLO as that user. This is the point where the two-token model pays off.
 */
export function reploClientForRequest(extra: { authInfo?: AuthInfo }): ReploClient {
  const reploToken = extra.authInfo?.extra?.reploToken;
  // TEMP DIAGNOSTIC: which token are we about to use, and against which API?
  console.error(
    `[replo-mcp] reploClientForRequest: reploToken present=${typeof reploToken === "string"}` +
      ` prefix=${typeof reploToken === "string" ? reploToken.slice(0, 8) : "n/a"}` +
      ` len=${typeof reploToken === "string" ? reploToken.length : 0}` +
      ` baseUrl=${REPLO_API_URL}`,
  );
  if (typeof reploToken !== "string" || reploToken.length === 0) {
    throw new Error("No REPLO token in the request's auth context");
  }
  return new ReploClient({ baseUrl: REPLO_API_URL, accessToken: reploToken });
}
