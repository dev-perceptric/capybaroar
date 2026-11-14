// The Terms, Privacy Policy and DPA, the pure half: which versions are current (compliance/policies.json) and which
// ones a person still has to accept. No Supabase, so tests run it.
import POLICIES from "../../compliance/policies.json";

export type PolicyDoc = "terms" | "privacy" | "dpa";
export const DOCS: PolicyDoc[] = ["terms", "privacy", "dpa"];
export type Policy = { doc: PolicyDoc; title: string; version: string; url: string };

/** Whether the documents in compliance/policies.json are live. Until they are, nobody is asked to accept them. */
export const policiesPublished = (src: Record<string, unknown> = POLICIES) => src.published === true;

export const currentPolicies = (src: Record<string, unknown> = POLICIES): Policy[] =>
  DOCS.map((doc) => {
    const p = src[doc] as { title: string; version: string; url: string };
    return { doc, title: p.title, version: p.version, url: p.url };
  });

/** The current documents this person hasn't accepted yet, in order. Empty when they're up to date. */
export function stillToAccept(accepted: { document: string; version: string }[], current: Policy[] = currentPolicies()): Policy[] {
  const have = new Set(accepted.map((a) => `${a.document}@${a.version}`));
  return current.filter((p) => !have.has(`${p.doc}@${p.version}`));
}

/** Whether they never accepted anything (signed up with Google, or before consent was recorded). */
export const firstTime = (accepted: { document: string }[]) => accepted.length === 0;

/** The versions a form or button says were accepted must be the current ones; anything else is refused. */
export function acceptedNow(sent: unknown, current: Policy[] = currentPolicies()): Policy[] | null {
  if (!sent || typeof sent !== "object") return null;
  const s = sent as Record<string, unknown>;
  const out = current.filter((p) => s[p.doc] === p.version);
  return out.length ? out : null;
}
