import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { tokenStore } from "./tokenStore.js";

/**
 * Turns an opaque bearer token into AuthInfo by looking it up in the store.
 *
 * `requireBearerAuth` calls this on every request; a thrown InvalidTokenError
 * becomes a 401 + WWW-Authenticate response. (requireBearerAuth also rejects
 * tokens whose AuthInfo has no `expiresAt`, so every stored token must set one.)
 */
export const tokenVerifier: OAuthTokenVerifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const info = tokenStore.get(token);
    if (!info) throw new InvalidTokenError("Unknown or revoked token");
    return info;
  },
};
