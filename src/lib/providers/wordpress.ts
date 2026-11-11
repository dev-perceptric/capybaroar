import { safeRequest } from "../api/fetchSafe";
import { AuthError, NotFound, PostError, type Account, type MediaFile, type Provider, type Publishable, type Secret } from "./types";

// WordPress sites through the REST API (wp-json/wp/v2) with an application password, WordPress's own way for apps
// to sign in (Users, Profile, Application Passwords; HTTPS only). The site address is the person's, so every call
// goes through safeRequest: public internet only, checked on the IP it connects to.

const STATUSES = new Set(["publish", "draft", "pending"]);

/** "example.com", "https://example.com/blog/" → "https://example.com/blog". Only HTTPS: application passwords need it. */
export function siteOf(raw: string): string {
  const v = (raw ?? "").trim();
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    throw new PostError("Enter your site's address, like example.com");
  }
  if (u.protocol !== "https:") throw new PostError("Use your site's https:// address");
  return `${u.origin}${u.pathname.replace(/\/(wp-admin|wp-json)(\/.*)?$/, "").replace(/\/+$/, "")}`;
}

const basic = (user: string, pass: string) => `Basic ${Buffer.from(`${user}:${pass.replace(/\s+/g, "")}`).toString("base64")}`;

async function readAll(body: NodeJS.ReadableStream, max = 2_000_000): Promise<string> {
  const chunks: Buffer[] = [];
  let n = 0;
  for await (const c of body) {
    n += (c as Buffer).length;
    if (n > max) throw new Error("WordPress answered with too much data");
    chunks.push(c as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** One REST call. Turns WordPress's errors into AuthError (sign in again), PostError (no retry), NotFound or Error. */
export async function wp<T>(site: string, auth: string, path: string, init: { method?: string; json?: unknown; body?: Buffer; headers?: Record<string, string> } = {}, what = "WordPress"): Promise<T> {
  const headers: Record<string, string> = { Authorization: auth, Accept: "application/json", ...(init.headers ?? {}) };
  let body: string | Buffer | undefined = init.body;
  if (init.json !== undefined) {
    body = JSON.stringify(init.json);
    headers["Content-Type"] = "application/json";
  }
  if (body !== undefined) headers["Content-Length"] = String(Buffer.byteLength(body));
  const res = await safeRequest(new URL(`${site}/wp-json${path}`), { method: init.method ?? "GET", headers, body, timeoutMs: 60000 });
  const text = await readAll(res.body);
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (res.status >= 200 && res.status < 300) {
    if (data === null) throw new PostError(`${what}: the site didn't answer like WordPress. Check the address.`);
    return data as T;
  }
  const msg = (data as { message?: string } | null)?.message?.replace(/<[^>]+>/g, "") || `${res.status}`;
  if (res.status === 401) throw new AuthError(`${what}: ${msg}`);
  if (res.status === 404) throw new NotFound(`${what}: ${msg}`);
  if (res.status === 400 || res.status === 403 || res.status === 413 || res.status === 415) throw new PostError(`${what}: ${msg}`);
  throw new Error(`${what}: ${msg}`);
}

const creds = (s: Secret) => ({ site: String(s.extra.site ?? ""), auth: basic(String(s.extra.user ?? ""), s.accessToken) });

/** Plain text as WordPress paragraphs: blank lines start a new paragraph, single new lines become line breaks. */
export function toHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const linked = (s: string) => esc(s).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}">${u}</a>`);
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${linked(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/** Names typed in Categories or Tags as WordPress ids: found by name, or made when missing. */
async function termIds(site: string, auth: string, kind: "categories" | "tags", names: string[]): Promise<number[]> {
  const ids: number[] = [];
  for (const name of names) {
    const found = await wp<{ id: number; name: string }[]>(site, auth, `/wp/v2/${kind}?${new URLSearchParams({ search: name, per_page: "20" })}`, {}, "WordPress");
    const hit = found.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (hit) ids.push(hit.id);
    else ids.push((await wp<{ id: number }>(site, auth, `/wp/v2/${kind}`, { method: "POST", json: { name } }, `WordPress ${kind === "tags" ? "tag" : "category"}`)).id);
  }
  return ids;
}

const listOf = (v: string | undefined) => (v ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20);

async function upload(site: string, auth: string, m: MediaFile): Promise<number> {
  const name = m.name.replace(/[^\w.-]+/g, "-") || "picture.jpg";
  const r = await wp<{ id: number }>(site, auth, "/wp/v2/media", { method: "POST", body: await m.bytes(), headers: { "Content-Type": m.mime, "Content-Disposition": `attachment; filename="${name}"` } }, "WordPress upload");
  if (m.alt?.trim()) await wp(site, auth, `/wp/v2/media/${r.id}`, { method: "POST", json: { alt_text: m.alt.trim() } }, "WordPress alt text").catch(() => undefined);
  return r.id;
}

/** The post body for /wp/v2/posts: title, the text as paragraphs, status, and the featured picture once uploaded. */
export function postBody(p: Pick<Publishable, "text" | "settings">, extra: { featured?: number; categories?: number[]; tags?: number[] } = {}) {
  const status = STATUSES.has(p.settings.status) ? p.settings.status : "publish";
  return {
    title: (p.settings.title ?? "").trim(),
    content: toHtml(p.text),
    status,
    ...(p.settings.excerpt?.trim() ? { excerpt: p.settings.excerpt.trim() } : {}),
    ...(extra.featured ? { featured_media: extra.featured } : {}),
    ...(extra.categories?.length ? { categories: extra.categories } : {}),
    ...(extra.tags?.length ? { tags: extra.tags } : {}),
  };
}

export const wordpress: Provider = {
  network: "wordpress",
  form: {
    configured: () => true,
    fields: [
      { key: "site", label: "Site address", placeholder: "example.com" },
      { key: "user", label: "Username", placeholder: "Your WordPress username" },
      { key: "password", label: "Application password", placeholder: "Users, Profile, Application Passwords", secret: true },
    ],
    connect: async (values): Promise<Account[]> => {
      const site = siteOf(values.site);
      const user = (values.user ?? "").trim();
      const pass = (values.password ?? "").trim();
      if (!user || !pass) throw new PostError("Enter your username and an application password");
      const auth = basic(user, pass);
      const me = await wp<{ id: number; name: string; capabilities?: Record<string, boolean> }>(site, auth, "/wp/v2/users/me?context=edit", {}, "WordPress sign-in").catch((e) => {
        if (e instanceof AuthError) throw new PostError("WordPress didn't accept that username and application password");
        if (e instanceof NotFound) throw new PostError("This site's REST API isn't reachable. Check the address, and that the REST API is on.");
        throw e;
      });
      if (me.capabilities && !me.capabilities.publish_posts) throw new PostError("This WordPress user can't publish posts. Use an author, editor or administrator.");
      const info = await wp<{ name?: string; site_icon_url?: string }>(site, auth, "/", {}, "WordPress").catch(() => ({}) as { name?: string; site_icon_url?: string });
      return [{ accountId: `${new URL(site).host}${new URL(site).pathname.replace(/\/$/, "")}:${me.id}`, name: info.name?.trim() || new URL(site).host, username: me.name, avatar: info.site_icon_url || null, accessToken: pass.replace(/\s+/g, ""), extra: { site, user } }];
    },
  },
  check: (p) => {
    if (!(p.settings.title ?? "").trim()) return "WordPress posts need a title";
    if (p.media.some((m) => !m.mime.startsWith("image/"))) return "WordPress takes pictures as the featured image only";
    if (p.media.length > 1) return "WordPress takes one picture, as the featured image";
    return null;
  },
  publish: async (s, _accountId, p) => {
    const { site, auth } = creds(s);
    const featured = p.media[0] ? await upload(site, auth, p.media[0]) : undefined;
    const [categories, tags] = [await termIds(site, auth, "categories", listOf(p.settings.categories)), await termIds(site, auth, "tags", listOf(p.settings.tags))];
    const r = await wp<{ id: number; link?: string }>(site, auth, "/wp/v2/posts", { method: "POST", json: postBody(p, { featured, categories, tags }) }, "WordPress post");
    return { id: String(r.id), url: r.link ?? null };
  },
  // Moves the post to the trash, where it can be restored.
  unpublish: async (s, _accountId, r) => {
    const { site, auth } = creds(s);
    await wp(site, auth, `/wp/v2/posts/${encodeURIComponent(r.id)}`, { method: "DELETE" }, "WordPress delete");
  },
};
