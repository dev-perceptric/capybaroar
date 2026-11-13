// Calls to addresses people give us. They prove: this server's own public addresses (45.90.109.7 and SELF_IPS) and
// private ones are refused by both guards, only ports 80 and 443 are called, Mastodon servers are names on 443, a
// server that sends one byte at a time hits the hard deadline (headers or body), and one slow webhook never holds
// up the others, under random failures too.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { isPublicAddress, isSelfAddress, isWebPort, SELF_IP } from "../src/lib/api/net";
import { BlockedAddress, guardedRequest, safeGet, safeRequest, type Guard } from "../src/lib/api/fetchSafe";
import { checkUrl, isPrivateAddress, safeGet as feedGet } from "../src/lib/safefetch";
import { fillPool, newPool } from "../src/lib/api/hookPool";
import { normalize } from "../src/lib/providers/mastodon";
import { PostError } from "../src/lib/providers/types";

const withSelf = async <T>(list: string, run: () => T | Promise<T>): Promise<T> => {
  const had = process.env.SELF_IPS;
  process.env.SELF_IPS = list;
  try {
    return await run();
  } finally {
    if (had === undefined) delete process.env.SELF_IPS;
    else process.env.SELF_IPS = had;
  }
};

test("this server's own public addresses are never called, however they're written", async () => {
  assert.equal(SELF_IP, "45.90.109.7");
  for (const ip of ["45.90.109.7", "::ffff:45.90.109.7", "::ffff:2d5a:6d07", "64:ff9b::2d5a:6d07", "[::ffff:45.90.109.7]"]) {
    assert.equal(isSelfAddress(ip), true, ip);
    assert.equal(isPublicAddress(ip.replace(/^\[|\]$/g, "")), false, ip);
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  assert.equal(isPublicAddress("45.90.109.8"), true, "the neighbour is someone else's");
  await withSelf(" 203.0.114.9 , 2a05:d014:1:2::5,not-an-ip", () => {
    for (const ip of ["203.0.114.9", "::ffff:203.0.114.9", "2a05:d014:1:2:0:0:0:5", "2a05:d014:1:2::5", "45.90.109.7"]) {
      assert.equal(isPublicAddress(ip), false, ip);
      assert.equal(isPrivateAddress(ip), true, ip);
    }
    assert.equal(isPublicAddress("203.0.114.10"), true);
    assert.equal(isPublicAddress("2a05:d014:1:2::6"), true);
  });
  // Changing SELF_IPS takes effect without a restart of the module.
  assert.equal(isPublicAddress("203.0.114.9"), true);
  await assert.rejects(safeRequest(new URL("https://45.90.109.7/hook"), { timeoutMs: 2000 }), BlockedAddress);
  await assert.rejects(safeRequest(new URL("https://[::ffff:45.90.109.7]/hook"), { timeoutMs: 2000 }), BlockedAddress);
  assert.throws(() => checkUrl("https://45.90.109.7/feed"), /reachable/);
  await assert.rejects(feedGet("http://45.90.109.7/feed", { maxBytes: 1000, timeoutMs: 2000 }), /reachable/);
});

test("private, loopback and metadata addresses are refused by both guards", async () => {
  for (const ip of ["10.0.0.5", "127.0.0.1", "169.254.169.254", "192.168.1.1", "::1", "fd00::1", "::ffff:10.0.0.1"]) {
    assert.equal(isPublicAddress(ip), false, ip);
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  await assert.rejects(safeRequest(new URL("http://169.254.169.254/latest/meta-data/"), { timeoutMs: 2000 }), BlockedAddress);
  await assert.rejects(safeRequest(new URL("https://[fd00::1]/"), { timeoutMs: 2000 }), BlockedAddress);
  await assert.rejects(safeGet(new URL("http://10.0.0.5/a.png"), 2000), BlockedAddress);
});

test("only ports 80 and 443 are called", async () => {
  for (const u of ["https://example.com/", "http://example.com/", "https://example.com:443/", "http://example.com:80/", "http://example.com:443/"]) assert.equal(isWebPort(new URL(u)), true, u);
  for (const u of ["https://example.com:8443/", "http://example.com:22/", "http://example.com:6379/", "https://example.com:1/"]) assert.equal(isWebPort(new URL(u)), false, u);
  // Refused before any connection: nothing listens on these and no DNS answer is needed.
  await assert.rejects(safeRequest(new URL("https://hooks.example.com:8443/x"), { timeoutMs: 2000 }), (e: unknown) => e instanceof BlockedAddress && /Port 8443/.test((e as Error).message));
  await assert.rejects(safeGet(new URL("http://cdn.example.com:2375/a.png"), 2000), BlockedAddress);
  assert.throws(() => checkUrl("https://example.com:8080/feed"), /port 443 or 80/);
  assert.equal(checkUrl("https://example.com:443/feed").hostname, "example.com");
});

test("a Mastodon server is a name on port 443: IP addresses and other ports are refused", () => {
  assert.equal(normalize("https://Mastodon.social/"), "mastodon.social");
  assert.equal(normalize("@me@mastodon.social"), "mastodon.social");
  assert.equal(normalize("mastodon.social:443"), "mastodon.social");
  assert.equal(normalize("fosstodon.org"), "fosstodon.org");
  for (const bad of ["127.0.0.1", "45.90.109.7", "0x7f.0.0.1", "2130706433", "10.0.0.1:443", "[::1]", "mastodon.social:8080", "mastodon.social:80", "localhost", "https://169.254.169.254/", "me@10.1.2.3", ""]) {
    assert.throws(() => normalize(bad), PostError, bad);
  }
});

// A guard that reaches a local server, for the timing tests: the name resolves to 127.0.0.1 and any port is fine.
const local: Guard = {
  lookup: ((_host: string, opts: { all?: boolean } | number, cb: (e: null, a: unknown, f?: number) => void) =>
    typeof opts === "object" && opts.all ? cb(null, [{ address: "127.0.0.1", family: 4 }]) : cb(null, "127.0.0.1", 4)) as Guard["lookup"],
  check: () => undefined,
};

async function listen(server: http.Server | net.Server): Promise<number> {
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return (server.address() as { port: number }).port;
}

test("a server that drips its body one byte at a time hits the hard deadline", async () => {
  const timers = new Set<NodeJS.Timeout>();
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/plain" });
    // A byte every 50 ms: the idle timeout (1 s) never fires.
    const t = setInterval(() => res.write("x"), 50);
    timers.add(t);
    res.on("close", () => clearInterval(t));
  });
  const port = await listen(server);
  try {
    const started = Date.now();
    const res = await guardedRequest(new URL(`http://drip.test:${port}/`), { timeoutMs: 1000, deadlineMs: 600 }, local);
    assert.equal(res.status, 200);
    await assert.rejects(
      (async () => {
        for await (const _ of res.body) void _;
      })(),
      /No full answer within/,
    );
    const took = Date.now() - started;
    assert.ok(took >= 550 && took < 1500, `ended at the deadline, took ${took} ms`);
    // A caller that only drains the body (webhooks) doesn't crash when the deadline destroys it.
    const drained = await guardedRequest(new URL(`http://drip.test:${port}/`), { timeoutMs: 1000, deadlineMs: 300 }, local);
    drained.body.resume();
    await new Promise<void>((r) => drained.body.on("close", () => r()));
  } finally {
    for (const t of timers) clearInterval(t);
    server.closeAllConnections();
    server.close();
  }
});

test("a server that drips its headers one byte at a time hits the hard deadline", async () => {
  const head = "HTTP/1.1 200 OK\r\nX-Slow: " + "a".repeat(1000);
  const sockets = new Set<net.Socket>();
  const server = net.createServer((s) => {
    sockets.add(s);
    let i = 0;
    const t = setInterval(() => (i < head.length ? s.write(head[i++]) : undefined), 50);
    s.on("close", () => clearInterval(t));
    s.on("error", () => clearInterval(t));
  });
  const port = await listen(server);
  try {
    const started = Date.now();
    await assert.rejects(guardedRequest(new URL(`http://drip.test:${port}/`), { method: "POST", body: "{}", timeoutMs: 1000, deadlineMs: 500 }, local), /No full answer within/);
    const took = Date.now() - started;
    assert.ok(took >= 450 && took < 1500, `ended at the deadline, took ${took} ms`);
  } finally {
    for (const s of sockets) s.destroy();
    server.close();
  }
});

test("the deadline doesn't cut off an answer that finishes in time, and defaults to the timeout", async () => {
  const server = http.createServer((_req, res) => res.end("ok"));
  const port = await listen(server);
  try {
    for (let i = 0; i < 5; i++) {
      const res = await guardedRequest(new URL(`http://quick.test:${port}/`), { timeoutMs: 2000 }, local);
      let text = "";
      for await (const c of res.body) text += c;
      assert.equal(text, "ok");
    }
  } finally {
    server.close();
  }
});

test("one slow webhook holds only its own slot; the rest are delivered and the call returns", async () => {
  const sockets = new Set<net.Socket>();
  // /slow drips forever; /ok answers at once; /flaky answers 500 or drops the connection at random.
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const server = http.createServer((req, res) => {
    if (req.url === "/slow") {
      res.writeHead(200);
      const t = setInterval(() => res.write("x"), 50);
      res.on("close", () => clearInterval(t));
      return;
    }
    if (req.url === "/flaky" && rand() < 0.5) {
      if (rand() < 0.5) return req.socket.destroy();
      res.statusCode = 500;
      return res.end();
    }
    res.end("ok");
  });
  server.on("connection", (s) => sockets.add(s));
  const port = await listen(server);
  type Job = { id: number; path: string };
  const queue: Job[] = [{ id: 0, path: "/slow" }, ...Array.from({ length: 14 }, (_, i) => ({ id: i + 1, path: i % 3 ? "/ok" : "/flaky" }))];
  const finished = new Map<number, { at: number; status: number | null; error: string | null }>();
  const send = async (j: Job) => {
    let status: number | null = null;
    let error: string | null = null;
    try {
      // Like deliverOne: send, then drain the body without waiting for it.
      const res = await guardedRequest(new URL(`http://hooks.test:${port}${j.path}`), { method: "POST", body: "{}", timeoutMs: 2000, deadlineMs: 1500 }, local);
      res.body.resume();
      status = res.status;
      // The slow one's body never ends: wait for the deadline to end it, as a worker would be held by it.
      if (j.path === "/slow") await new Promise<void>((r) => res.body.on("close", () => r()));
    } catch (e) {
      error = (e as Error).message;
    }
    assert.ok(!finished.has(j.id), "each delivery settles once");
    finished.set(j.id, { at: Date.now(), status, error });
  };
  const pool = newPool();
  const started = Date.now();
  try {
    const claimed = await fillPool<Job>(pool, { slots: 3, budgetMs: 5000, claim: async (n) => queue.splice(0, n), work: send });
    const returned = Date.now();
    assert.equal(claimed, 15);
    // The call returned once the queue was empty, without waiting for the slow one.
    assert.ok(returned - started < 1000, `returned in ${returned - started} ms`);
    // The last few settle on their own; everything but the slow one is done long before the slow one's deadline.
    while (pool.running.size > 1 && Date.now() - started < 1300) await Promise.race([...pool.running]);
    for (let id = 1; id <= 14; id++) assert.ok(finished.has(id) && finished.get(id)!.at - started < 1300, `delivery ${id} finished`);
    assert.ok(!finished.has(0), "the slow one is still running");
    assert.equal(pool.running.size, 1, "the slow one keeps its slot");
    // A next call has the other two slots, at once.
    queue.push({ id: 15, path: "/ok" }, { id: 16, path: "/ok" });
    assert.equal(await fillPool<Job>(pool, { slots: 3, budgetMs: 5000, claim: async (n) => queue.splice(0, n), work: send }), 2);
    while (pool.running.size > 1 && Date.now() - started < 1300) await Promise.race([...pool.running]);
    assert.ok(finished.has(15) && finished.has(16) && !finished.has(0), "the next two went out while the slow one still ran");
    // The slow one ends at its hard deadline, on its own.
    await Promise.all([...pool.running]);
    const slow = finished.get(0)!;
    assert.ok(slow.at - started >= 1400 && slow.at - started < 3000, `slow one ended at ${slow.at - started} ms`);
    assert.equal(pool.running.size, 0);
    // The flaky ones each ended once with an answer or an error, never neither.
    for (const [, f] of finished) assert.ok(f.status !== null || f.error !== null);
  } finally {
    for (const s of sockets) s.destroy();
    server.close();
  }
});

test("the pool under random failures: every claimed job settles exactly once, slots are never over-filled", async () => {
  let seed = 3;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pool = newPool();
  let next = 0;
  const total = 200;
  const settled = new Map<number, number>();
  let running = 0;
  let peak = 0;
  const failedIds: number[] = [];
  while (next < total || pool.running.size) {
    await fillPool<number>(pool, {
      slots: 5,
      budgetMs: 200,
      claim: async (n) => {
        if (rand() < 0.1) throw new Error("claim hiccup");
        const k = Math.min(n, total - next, Math.ceil(rand() * n));
        return Array.from({ length: k }, () => next++);
      },
      work: async (id) => {
        running++;
        peak = Math.max(peak, running);
        try {
          await new Promise((r) => setTimeout(r, rand() < 0.1 ? 150 : rand() * 10));
          if (rand() < 0.3) throw new Error("boom");
        } finally {
          running--;
          settled.set(id, (settled.get(id) ?? 0) + 1);
        }
      },
      failed: (id) => failedIds.push(id),
    }).catch(() => 0);
    if (pool.running.size) await Promise.race([...pool.running]);
  }
  assert.equal(next, total);
  assert.equal(settled.size, total);
  for (const [, n] of settled) assert.equal(n, 1);
  assert.ok(peak <= 5, `at most 5 at once, saw ${peak}`);
  assert.ok(failedIds.length > 0 && new Set(failedIds).size === failedIds.length);
});
