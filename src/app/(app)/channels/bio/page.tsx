import { redirect } from "next/navigation";
import { Plug } from "lucide-react";
import { Page } from "@/components/ui";
import { ChannelTabs } from "@/components/ChannelTabs";
import { BioEditor } from "@/components/BioEditor";
import { getBrandCtx, homeBrand } from "@/lib/brands";
import { bioClicks, bioUrl, getBioPage, latestPosts, slugFrom } from "@/lib/bio";
import { listMedia, mediaThumbs } from "@/lib/media";

export default async function BioEditorPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const b = await getBrandCtx();
  if (b.role === "client") redirect("/calendar");
  const want = (await searchParams).brand;
  const brands = b.brands.filter((x) => !b.scope || b.scope.includes(x.id));
  const brand = brands.find((x) => x.id === want) ?? brands.find((x) => x.id === homeBrand(b)) ?? brands[0];
  if (!brand) redirect("/channels");
  const [page, media, posts] = await Promise.all([getBioPage(b.workspaceId, brand.id), listMedia(b.workspaceId), latestPosts(b.workspaceId, brand.id)]);
  const [clicks, thumbs] = await Promise.all([bioClicks(b.workspaceId, (page?.links ?? []).map((l) => l.code)), mediaThumbs(b.workspaceId, posts.map((p) => p.mediaId).filter((m): m is string => !!m))]);
  return (
    <Page icon={<Plug />} title="Channels" tabs={<ChannelTabs />}>
      <BioEditor
        key={brand.id}
        brand={{ id: brand.id, name: brand.name }}
        brands={b.brand ? [] : brands.map((x) => ({ id: x.id, name: x.name }))}
        page={page}
        clicks={clicks}
        base={bioUrl("")}
        suggested={slugFrom(brand.name)}
        images={media.filter((m) => m.mime.startsWith("image/")).map((m) => ({ id: m.id, name: m.name, thumb: m.thumb }))}
        posts={posts.map((p) => ({ text: p.text, url: p.url, thumb: thumbs.find((t) => t.id === p.mediaId)?.thumb ?? null }))}
      />
    </Page>
  );
}
