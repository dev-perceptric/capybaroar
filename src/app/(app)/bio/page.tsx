import { redirect } from "next/navigation";
import { BioEditor, type BioTab } from "@/components/BioEditor";
import { getBrandCtx, homeBrand } from "@/lib/brands";
import { bioUrl, getBioPage, latestPosts, socialDefaults } from "@/lib/bio";
import { listMedia, mediaThumbs } from "@/lib/media";
import { PLANS, effectivePlan, getBilling } from "@/lib/billing";
import { canManage } from "@/lib/session";

const TABS: BioTab[] = ["blocks", "appearance", "analytics", "settings"];

export default async function BioEditorPage({ searchParams }: { searchParams: Promise<{ brand?: string; tab?: string }> }) {
  const b = await getBrandCtx();
  if (b.role === "client") redirect("/calendar");
  const q = await searchParams;
  const brands = b.brands.filter((x) => !b.scope || b.scope.includes(x.id));
  const brand = brands.find((x) => x.id === q.brand) ?? brands.find((x) => x.id === homeBrand(b)) ?? brands[0];
  if (!brand) redirect("/calendar");
  const [page, media, posts, social, billing] = await Promise.all([
    getBioPage(b.workspaceId, brand.id),
    listMedia(b.workspaceId),
    latestPosts(b.workspaceId, brand.id, 12),
    socialDefaults(b.workspaceId, brand.id),
    getBilling(b.workspaceId),
  ]);
  const thumbs = await mediaThumbs(b.workspaceId, posts.map((p) => p.mediaId));
  return (
    <BioEditor
      key={brand.id}
      brand={{ id: brand.id, name: brand.name }}
      brands={b.brand ? [] : brands.map((x) => ({ id: x.id, name: x.name }))}
      page={page}
      base={bioUrl("")}
      images={media.filter((m) => m.mime.startsWith("image/")).map((m) => ({ id: m.id, name: m.name, thumb: m.thumb }))}
      posts={posts.map((p) => ({ id: p.id, text: p.text, url: p.url, thumb: thumbs.find((t) => t.id === p.mediaId)?.thumb ?? null }))}
      social={social}
      badgeOff={PLANS[effectivePlan(billing)].bioBadgeOff}
      agent={PLANS[effectivePlan(billing)].ai}
      canUpgrade={canManage(b.role)}
      tab={TABS.find((t) => t === q.tab) ?? "blocks"}
    />
  );
}
