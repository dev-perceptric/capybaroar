import { redirect } from "next/navigation";

// Link in bio has its own section now.
export default async function OldBioPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand } = await searchParams;
  redirect(brand ? `/bio?brand=${encodeURIComponent(brand)}` : "/bio");
}
