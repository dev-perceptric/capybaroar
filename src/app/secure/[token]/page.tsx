import { SecureForm } from "./SecureForm";

export const dynamic = "force-dynamic";

// Opened from "This wasn't me" in the new-device email (src/lib/devices.ts). Nothing happens until the button is
// pressed, so a mail scanner that opens links can't sign anyone out.
export default async function SecurePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SecureForm token={token} />;
}
