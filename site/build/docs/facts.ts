// Network facts for the docs, read from the app itself: npx tsx site/build/docs/facts.ts > site/build/docs/facts.json
import { NETWORKS, isPaused } from "../../../src/lib/networks";
import { PROVIDERS } from "../../../src/lib/providers";
const out = NETWORKS.map((n: any) => {
  const p: any = (PROVIDERS as any)[n.id];
  return { id: n.id, name: n.name, limit: n.limit, needsMedia: !!n.needsMedia, inbox: n.inbox ?? null, paused: isPaused(n.id),
    fields: (n.fields ?? []).map((f: any) => ({ key: f.key, label: f.label, kind: f.kind, initial: f.initial, required: f.required, options: f.options?.map((o: any) => o.label), when: f.when })),
    connect: p?.oauth ? "oauth" : p?.form ? "form" : "none", asks: p?.oauth?.asks?.map((a: any) => a.label) ?? [], formFields: p?.form?.fields?.map((f: any) => f.label) ?? [],
    hasFollowers: !!p?.followers, hasStats: !!p?.postStats, hasRevoke: !!p?.revoke };
});
console.log(JSON.stringify(out, null, 1));
