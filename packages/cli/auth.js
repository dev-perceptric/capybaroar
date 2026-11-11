// Signing in through the browser: the CLI registers itself as an app (dynamic client registration), opens Capybaroar's
// approve page with PKCE, takes the code on a one-time local address, and keeps the tokens in ~/.config/capybaroar.
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const DIR = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "capybaroar");
const FILE = join(DIR, "auth.json");
const b64url = (b) => b.toString("base64url");

export const baseUrl = () => (process.env.CAPYBAROAR_URL || "https://app.capybaroar.com").replace(/\/+$/, "");

export async function readAuth() {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return null;
  }
}

async function saveAuth(a) {
  await mkdir(DIR, { recursive: true, mode: 0o700 });
  await writeFile(FILE, JSON.stringify(a, null, 2), { mode: 0o600 });
}

export const logout = () => rm(FILE, { force: true });

async function form(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body).toString() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || `Sign-in failed (${res.status})`);
  return data;
}

const tokens = (t, base, clientId) => ({ base, client_id: clientId, access_token: t.access_token, refresh_token: t.refresh_token, expires_at: Date.now() + (t.expires_in ?? 3600) * 1000 });

function openBrowser(url) {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
  } catch {
    // printed below for people to open themselves
  }
}

/** Signs in through the browser and saves the tokens. */
export async function login() {
  const base = baseUrl();
  const reg = await fetch(`${base}/api/oauth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_name: "Capybaroar CLI", redirect_uris: ["http://127.0.0.1/callback"], token_endpoint_auth_method: "none" }),
  }).then((r) => r.json());
  if (!reg.client_id) throw new Error(reg.error_description || "Couldn't register the CLI with Capybaroar");
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const state = b64url(randomBytes(16));
  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url, "http://127.0.0.1");
      if (u.pathname !== "/callback") return res.writeHead(404).end();
      const ok = u.searchParams.get("state") === state && u.searchParams.get("code");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(ok ? "<p>Signed in. You can close this tab.</p>" : `<p>Sign-in didn't finish: ${u.searchParams.get("error_description") || u.searchParams.get("error") || "try again"}.</p>`);
      server.close();
      if (ok) resolve(u.searchParams.get("code"));
      else reject(new Error(u.searchParams.get("error_description") || "Sign-in was cancelled"));
    });
    server.listen(0, "127.0.0.1", () => {
      const redirect = `http://127.0.0.1:${server.address().port}/callback`;
      server.redirect = redirect;
      const url = `${base}/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: reg.client_id, redirect_uri: redirect, code_challenge: challenge, code_challenge_method: "S256", state })}`;
      console.log(`Opening your browser to sign in. If it doesn't open, visit:\n${url}`);
      openBrowser(url);
    });
    setTimeout(() => (server.close(), reject(new Error("Sign-in timed out after 5 minutes"))), 300000).unref();
    login.server = server;
  });
  const t = await form(`${base}/api/oauth/token`, { grant_type: "authorization_code", code, redirect_uri: login.server.redirect, client_id: reg.client_id, code_verifier: verifier });
  await saveAuth(tokens(t, base, reg.client_id));
}

/** A token for the API: CAPYBAROAR_API_KEY, or the saved sign-in, refreshed when it's about to expire. */
export async function accessToken() {
  if (process.env.CAPYBAROAR_API_KEY) return process.env.CAPYBAROAR_API_KEY;
  const a = await readAuth();
  if (!a) throw new Error("Run capybaroar login first, or set CAPYBAROAR_API_KEY");
  if (a.expires_at - Date.now() > 60000) return a.access_token;
  const t = await form(`${a.base}/api/oauth/token`, { grant_type: "refresh_token", refresh_token: a.refresh_token, client_id: a.client_id }).catch(async (e) => {
    await logout();
    throw new Error(`${e.message}. Run capybaroar login again.`);
  });
  const next = tokens(t, a.base, a.client_id);
  await saveAuth(next);
  return next.access_token;
}
