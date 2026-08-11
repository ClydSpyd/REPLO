/**
 * The HTML login page shown at /authorize. It collects REPLO credentials and
 * carries the OAuth flow parameters forward as hidden fields, POSTing to /login
 * (our own route) — which verifies the credentials and issues the auth code.
 *
 * The password only ever travels from this form to our server → REPLO's login;
 * the MCP client never sees it.
 */

export interface LoginPageParams {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
  resource?: string;
}

const esc = (s: string | undefined): string =>
  (s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

const hidden = (name: string, value: string | undefined): string =>
  value === undefined ? "" : `<input type="hidden" name="${name}" value="${esc(value)}">`;

export function renderLoginPage(
  params: LoginPageParams,
  error?: string,
): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in to REPLO</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #0d1016; color: #e7eaf2; display: grid; place-items: center;
    min-height: 100vh; margin: 0; }
  .card { background: #151a22; border: 1px solid #262d38; border-radius: 14px;
    padding: 2rem; width: min(92vw, 360px); box-shadow: 0 10px 40px rgba(0,0,0,.4); }
  h1 { font-size: 1.15rem; margin: 0 0 .3rem; }
  p.sub { color: #9aa4b3; font-size: .85rem; margin: 0 0 1.4rem; }
  label { display: block; font-size: .8rem; color: #9aa4b3; margin: .9rem 0 .3rem; }
  input[type=email], input[type=password] { width: 100%; box-sizing: border-box;
    padding: .6rem .7rem; border-radius: 8px; border: 1px solid #2b3340;
    background: #0d1016; color: #e7eaf2; font-size: .95rem; }
  button { width: 100%; margin-top: 1.4rem; padding: .7rem; border: 0;
    border-radius: 8px; background: #7c4dff; color: #fff; font-weight: 600;
    font-size: .95rem; cursor: pointer; }
  button:hover { background: #6b3ef0; }
  .err { background: #3a1720; border: 1px solid #7f2a3a; color: #ffb3c0;
    padding: .55rem .7rem; border-radius: 8px; font-size: .82rem; margin-bottom: 1rem; }
  .foot { color: #6b7686; font-size: .72rem; margin-top: 1.2rem; text-align: center; }
</style>
</head>
<body>
  <form class="card" method="post" action="/login">
    <h1>Sign in to REPLO</h1>
    <p class="sub">Authorize this app to access your training data.</p>
    ${error ? `<div class="err">${esc(error)}</div>` : ""}
    ${hidden("client_id", params.clientId)}
    ${hidden("redirect_uri", params.redirectUri)}
    ${hidden("code_challenge", params.codeChallenge)}
    ${hidden("state", params.state)}
    ${hidden("resource", params.resource)}
    <label for="email">Email</label>
    <input id="email" type="email" name="email" autocomplete="username" required autofocus>
    <label for="password">Password</label>
    <input id="password" type="password" name="password" autocomplete="current-password" required>
    <button type="submit">Sign in &amp; authorize</button>
    <p class="foot">You are authorizing an MCP client. Your password is sent only to REPLO.</p>
  </form>
</body>
</html>`;
}
