/**
 * In-memory stores for the OAuth authorization-code and refresh-token grants (M3).
 *
 * An authorization code is short-lived and single-use: it ties together the
 * PKCE challenge, the redirect URI, and — crucially — the user's REPLO JWT
 * (Token B) captured at login, so the token exchange can bind Token A → Token B.
 */

export interface AuthCodeData {
  clientId: string;
  codeChallenge: string;
  redirectUri: string;
  resource?: string;
  reploToken: string; // Token B — the user's REPLO JWT
  expiresAt: number; // epoch seconds
}

export interface RefreshData {
  clientId: string;
  reploToken: string; // Token B
  scopes: string[];
  resource?: string;
}

const nowSec = () => Math.floor(Date.now() / 1000);

class CodeStore {
  private readonly codes = new Map<string, AuthCodeData>();
  private readonly refresh = new Map<string, RefreshData>();

  saveCode(code: string, data: AuthCodeData): void {
    this.codes.set(code, data);
  }

  /** Peek without consuming (used for PKCE challenge lookup). */
  peekCode(code: string): AuthCodeData | undefined {
    const data = this.codes.get(code);
    if (data && data.expiresAt < nowSec()) {
      this.codes.delete(code);
      return undefined;
    }
    return data;
  }

  /** Get and delete — authorization codes are single-use. */
  consumeCode(code: string): AuthCodeData | undefined {
    const data = this.peekCode(code);
    if (data) this.codes.delete(code);
    return data;
  }

  saveRefresh(token: string, data: RefreshData): void {
    this.refresh.set(token, data);
  }

  getRefresh(token: string): RefreshData | undefined {
    return this.refresh.get(token);
  }
}

export const codeStore = new CodeStore();
