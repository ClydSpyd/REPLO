import type { Request, Response } from "express";
import { ReploClient } from "../upstream/reploClient.js";
import { codeStore } from "./codeStore.js";
import { renderLoginPage } from "./loginPage.js";
import { newId } from "./ids.js";

const CODE_TTL = 600; // authorization code lifetime, seconds

/**
 * Handles the credential POST from the login page (POST /login).
 *
 * Verifies the submitted REPLO email/password by actually logging in (yielding
 * Token B), stashes a single-use authorization code bound to that Token B and
 * the PKCE challenge, then redirects back to the client with the code.
 */
export function makeLoginHandler(reploApiUrl: string) {
  return async (req: Request, res: Response): Promise<void> => {
    const { email, password, client_id, redirect_uri, code_challenge, state, resource } =
      req.body as Record<string, string | undefined>;

    if (!client_id || !redirect_uri || !code_challenge) {
      res.status(400).send("Missing required OAuth parameters.");
      return;
    }

    const renderError = (msg: string) => {
      res.status(401).setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(
        renderLoginPage(
          { clientId: client_id, redirectUri: redirect_uri, codeChallenge: code_challenge, state, resource },
          msg,
        ),
      );
    };

    // Verify credentials against REPLO's real login → Token B.
    const probe = new ReploClient({
      baseUrl: reploApiUrl,
      email: email ?? "",
      password: password ?? "",
    });
    let reploToken: string;
    try {
      reploToken = await probe.login();
    } catch {
      renderError("Invalid email or password.");
      return;
    }

    const code = newId("rmc"); // replo-mcp authorization code
    codeStore.saveCode(code, {
      clientId: client_id,
      codeChallenge: code_challenge,
      redirectUri: redirect_uri,
      resource,
      reploToken,
      expiresAt: Math.floor(Date.now() / 1000) + CODE_TTL,
    });

    const url = new URL(redirect_uri);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);
    res.redirect(302, url.href);
  };
}
