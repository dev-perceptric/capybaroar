import type { Metadata } from "next";
import { connection } from "next/server";
import { brandForReview } from "@/lib/brands";
import { postsInReview } from "@/lib/posts";
import { listChannels } from "@/lib/channels";
import { mediaThumbs } from "@/lib/media";
import { adminClient } from "@/lib/supabase/server";
import { fmtParts } from "@/lib/format";
import { ReviewBoard, type ReviewPost } from "@/components/ReviewBoard";
import { InviteCard } from "@/components/InviteCard";

export const metadata: Metadata = { title: "Review posts", robots: { index: false, follow: false } };

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  await connection(); // always fresh: posts move in and out of review
  const { token } = await params;
  const brand = await brandForReview(token);
  if (!brand) return <InviteCard title="This review link was turned off" line="Ask for a new one." />;
  const [posts, channels, { data: ws }] = await Promise.all([
    postsInReview(brand.workspaceId, brand.id),
    listChannels(brand.workspaceId, [brand.id]),
    adminClient().from("workspaces").select("timezone").eq("id", brand.workspaceId).single(),
  ]);
  const media = await mediaThumbs(brand.workspaceId, [...new Set(posts.flatMap((p) => p.media_ids))]);
  const timeZone = (ws?.timezone as string | undefined) ?? "UTC";
  const shown: ReviewPost[] = posts.map((p) => ({
    id: p.id,
    when: p.publish_at ? fmtParts(p.publish_at, { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }) : null,
    media: p.media_ids.map((id) => media.find((m) => m.id === id)).filter((m) => m !== undefined),
    targets: p.post_targets.flatMap((t) => {
      const channel = channels.find((c) => c.id === t.channel_id);
      return channel ? [{ channel, text: t.text ?? p.text, settings: t.settings ?? {} }] : [];
    }),
  }));
  return <ReviewBoard token={token} brand={brand.name} posts={shown} />;
}
