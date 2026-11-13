import { MediaView } from "@/components/MediaView";
import { listMedia } from "@/lib/media";
import { teamCtx } from "@/lib/session";
import { aiReady } from "@/lib/generations";

export default async function MediaPage() {
  const ctx = await teamCtx();
  const files = await listMedia(ctx.workspaceId, { brandIds: ctx.brandIds, userId: ctx.userId });
  return <MediaView files={files} ai={aiReady()} />;
}
