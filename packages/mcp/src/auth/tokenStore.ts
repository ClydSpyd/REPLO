import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

/**
 * In-memory bearer-token store (M2).
 *
 * Maps an opaque access token → its AuthInfo (who/what the token represents).
 * In M3 the authorization server will populate this when it issues real tokens,
 * and in M5 it moves to Mongo for persistence. For now it's fine to lose on
 * restart — we just re-seed the dev token.
 */
class TokenStore {
  private readonly tokens = new Map<string, AuthInfo>();

  set(token: string, info: AuthInfo): void {
    this.tokens.set(token, info);
  }

  get(token: string): AuthInfo | undefined {
    return this.tokens.get(token);
  }

  delete(token: string): void {
    this.tokens.delete(token);
  }
}

export const tokenStore = new TokenStore();
