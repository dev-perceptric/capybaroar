// One MCP message to the hosted server and its answer. Busy or unreachable servers are tried again a few times.
export async function forward(line, { key, url, fetchImpl = fetch, waitMs = 500 }) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } };
  }
  const fail = (message) => (msg.id === undefined ? null : { jsonrpc: "2.0", id: msg.id, error: { code: -32000, message } });
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetchImpl(url, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(msg) });
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await new Promise((r) => setTimeout(r, waitMs * 2 ** attempt));
        continue;
      }
      if (res.status === 202) return null; // a notification: nothing to answer
      const text = await res.text();
      if (!res.ok) return fail(text.slice(0, 300) || `${res.status}`);
      return text ? JSON.parse(text) : null;
    } catch (e) {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, waitMs * 2 ** attempt));
        continue;
      }
      return fail(`Couldn't reach Capybaroar: ${e.message}`);
    }
  }
}
