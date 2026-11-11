// Capybaroar's REST API (https://capybaroar.com/api). No dependencies: uses the global fetch (Node 18+, browsers).

export class CapybaroarError extends Error {
  /** @param {number} status @param {string} code @param {string} message */
  constructor(status, code, message) {
    super(message);
    this.name = "CapybaroarError";
    this.status = status;
    this.code = code;
  }
}

const RETRY = new Set([429, 500, 502, 503, 504]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class Capybaroar {
  /**
   * @param {{ apiKey?: string, accessToken?: string, baseUrl?: string, fetch?: typeof fetch, retries?: number }} [opts]
   * An API key from Settings, API and MCP (cbr_...), or an access token from signing in (cbo_...).
   */
  constructor(opts = {}) {
    const env = typeof process !== "undefined" ? process.env : {};
    this.token = opts.apiKey ?? opts.accessToken ?? env.CAPYBAROAR_API_KEY ?? "";
    if (!this.token) throw new CapybaroarError(0, "no_key", "Pass apiKey, or set CAPYBAROAR_API_KEY");
    this.base = (opts.baseUrl ?? env.CAPYBAROAR_URL ?? "https://app.capybaroar.com").replace(/\/+$/, "") + "/api/v1";
    this.fetch = opts.fetch ?? globalThis.fetch.bind(globalThis);
    this.retries = opts.retries ?? 3;
  }

  /** One request, retried with growing waits on 429 and 5xx. */
  async request(method, path, { query, body } = {}) {
    const url = new URL(this.base + path);
    for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
    for (let attempt = 0; ; attempt++) {
      const res = await this.fetch(url, {
        method,
        headers: { Authorization: `Bearer ${this.token}`, Accept: "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (RETRY.has(res.status) && attempt < this.retries) {
        const after = Number(res.headers.get("retry-after"));
        await wait(Number.isFinite(after) && after > 0 ? after * 1000 : 500 * 2 ** attempt);
        continue;
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new CapybaroarError(res.status, data?.error?.code ?? "error", data?.error?.message ?? `${res.status} ${res.statusText}`);
      return data;
    }
  }

  async brands() { return (await this.request("GET", "/brands")).brands; }
  async channels(brandId) { return (await this.request("GET", "/channels", { query: { brand_id: brandId } })).channels; }
  async channelGroups() { return (await this.request("GET", "/channel-groups")).groups; }
  async campaigns() { return (await this.request("GET", "/campaigns")).campaigns; }
  /** Posts with a publish time between from and to (ISO 8601 with an offset); the next 30 days by default. */
  async posts({ from, to, brandId } = {}) { return (await this.request("GET", "/posts", { query: { from, to, brand_id: brandId } })).posts; }
  async post(id) { return (await this.request("GET", `/posts/${encodeURIComponent(id)}`)).post; }
  /** Creates a post: channel_ids, text, mode (draft, schedule, now, queue), publish_at ("best" works too), thread, campaign_id... */
  async createPost(fields) { return (await this.request("POST", "/posts", { body: fields })).post; }
  async updatePost(id, fields) { return (await this.request("PATCH", `/posts/${encodeURIComponent(id)}`, { body: fields })).post; }
  /** Deletes here, or with everywhere: true on the networks too. */
  async deletePost(id, { everywhere = false, channelIds } = {}) { return this.request("DELETE", `/posts/${encodeURIComponent(id)}`, { query: { everywhere, channel_ids: channelIds } }); }
  async nextQueueSlot() { return (await this.request("GET", "/queue")).publish_at; }
  async media() { return (await this.request("GET", "/media")).media; }
  async uploadFromUrl(url, alt) { return (await this.request("POST", "/media", { body: { url, ...(alt ? { alt } : {}) } })).media; }
  /** Reach, engagement, top posts and best times for the last 7, 30 or 90 days. */
  async analytics({ days = 30, channelId } = {}) { return (await this.request("GET", "/analytics", { query: { days, channel_id: channelId } })).analytics; }
  async credits() { return this.request("GET", "/credits"); }
  async webhooks() { return (await this.request("GET", "/webhooks")).webhooks; }
}

export default Capybaroar;
