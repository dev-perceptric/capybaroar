import { readJson } from "@/lib/api/http";
import { partnerHookInput } from "@/lib/api/input";
import { partnerRoute } from "@/lib/api/partnerHttp";
import { PARTNER_EVENTS, STANDARD_SECRET, newStandardSecret, standardKey } from "@/lib/api/hookRules";
import { deletePartnerHook, getPartnerHook, setPartnerHook } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

const valid = (s: string) => {
  if (!STANDARD_SECRET.test(s)) return false;
  try {
    standardKey(s);
    return true;
  } catch {
    return false;
  }
};

/** The partner webhook, without its secret. */
export const GET = partnerRoute(async ({ partner }) => ({ body: { webhook: await getPartnerHook(partner.workspaceId), events: PARTNER_EVENTS } }));

/** Set the address (and secret) channel.connected and channel.lost go to. Without a secret a new one comes back, once. */
export const PUT = partnerRoute(async ({ req, partner }) => {
  const input = partnerHookInput(await readJson(req), valid);
  const secret = input.secret ?? newStandardSecret();
  const webhook = await setPartnerHook(partner.workspaceId, partner.userId, input.url, secret);
  return { body: { webhook, events: PARTNER_EVENTS, ...(input.secret ? {} : { secret }) } };
});

export const DELETE = partnerRoute(async ({ partner }) => {
  await deletePartnerHook(partner.workspaceId);
  return { status: 204, body: null };
});
