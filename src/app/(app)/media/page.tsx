import { Image as ImageIcon } from "lucide-react";
import { Button, Page } from "@/components/ui";
import { ToolIntro } from "@/components/ToolIntro";

export default function MediaPage() {
  return (
    <Page icon={<ImageIcon />} title="Media">
      <ToolIntro drawing="files" title="Add your first file" lead="Pictures and videos you upload here are ready for any post." action={<Button>Upload</Button>} />
    </Page>
  );
}
