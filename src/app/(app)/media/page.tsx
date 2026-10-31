import { Image as ImageIcon } from "lucide-react";
import { Page } from "@/components/ui";
import { MediaView } from "@/components/MediaView";
import { listMedia } from "@/lib/media";
import { getCtx } from "@/lib/session";

export default async function MediaPage() {
  const ctx = await getCtx();
  const files = await listMedia(ctx.workspaceId);
  return (
    <Page icon={<ImageIcon />} title="Media" count={files.length || undefined}>
      <MediaView files={files} />
    </Page>
  );
}
