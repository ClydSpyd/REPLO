import type { Response } from "express";
import type {
  OAuthServerProvider,
  AuthorizationParams,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { InvalidGrantError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { clientStore } from "./clientStore.js";
import { codeStore } from "./codeStore.js";
import { tokenStore } from "./tokenStore.js";
import { tokenVerifier } from "./verifier.js";
import { renderLoginPage } from "./loginPage.js";
import { newId } from "./ids.js";

const ACCESS_TTL = Number(process.env.MCP_ACCESS_TOKEN_TTL ?? 900); // seconds

/** Mint an access token (Token A) + store its AuthInfo, carrying Token B in `extra`. */
function issueAccessToken(
  clientId: string,
  reploToken: string,
  scopes: string[],
  resource?: string,
): { token: string; expiresIn: number } {
  const token = newId("rma"); // replo-mcp access token
  const expiresIn = ACCESS_TTL;
  const authInfo: AuthInfo = {
    token,
    clientId,
    scopes,
    expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
    resource: resource ? new URL(resource) : undefined,
    extra: { reploToken }, // Token B — used by tools to call REPLO as this user
  };
  tokenStore.set(token, authInfo);
  return { token, expiresIn };
}

/**
 * The REPLO OAuth 2.1 authorization server.
 *
 * Note: the interactive login (verifying REPLO credentials → minting an auth
 * code) happens in the /login route, not here. `authorize()` only renders the
 * form; the SDK's token handler drives challengeForAuthorizationCode +
 * exchangeAuthorizationCode.
 */
export const provider: OAuthServerProvider = {
  get clientsStore() {
    return clientStore;
  },

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ): Promise<void> {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(
      renderLoginPage({
        clientId: client.client_id,
        redirectUri: params.redirectUri,
        codeChallenge: params.codeChallenge,
        state: params.state,
        resource: params.resource?.href,
      }),
    );
  },

  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    const data = codeStore.peekCode(authorizationCode);
    if (!data || data.clientId !== client.client_id) {
      throw new InvalidGrantError("Invalid or expired authorization code");
    }
    return data.codeChallenge;
  },

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<OAuthTokens> {
    // PKCE was already verified by the SDK's token handler via
    // challengeForAuthorizationCode; here we just consume the code.
    const data = codeStore.consumeCode(authorizationCode);
    if (!data || data.clientId !== client.client_id) {
      throw new InvalidGrantError("Invalid or expired authorization code");
    }

    const { token, expiresIn } = issueAccessToken(
      client.client_id,
      data.reploToken,
      [],
      data.resource,
    );
    const refreshToken = newId("rmr"); // replo-mcp refresh token
    codeStore.saveRefresh(refreshToken, {
      clientId: client.client_id,
      reploToken: data.reploToken,
      scopes: [],
      resource: data.resource,
    });

    return {
      access_token: token,
      token_type: "Bearer",
      expires_in: expiresIn,
      refresh_token: refreshToken,
    };
  },

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
  ): Promise<OAuthTokens> {
    const data = codeStore.getRefresh(refreshToken);
    if (!data || data.clientId !== client.client_id) {
      throw new InvalidGrantError("Invalid refresh token");
    }
    const { token, expiresIn } = issueAccessToken(
      client.client_id,
      data.reploToken,
      scopes ?? data.scopes,
      data.resource,
    );
    return {
      access_token: token,
      token_type: "Bearer",
      expires_in: expiresIn,
      refresh_token: refreshToken, // reuse the same refresh token
    };
  },

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    return tokenVerifier.verifyAccessToken(token);
  },
};
