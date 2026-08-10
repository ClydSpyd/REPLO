import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { ReploClient } from "./reploClient.js";

const REPLO_API_URL = process.env.REPLO_API_URL ?? "http://localhost:6969";

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
  if (typeof reploToken !== "string" || reploToken.length === 0) {
    throw new Error("No REPLO token in the request's auth context");
  }
  return new ReploClient({ baseUrl: REPLO_API_URL, accessToken: reploToken });
}
