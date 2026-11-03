import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicBio } from "@/lib/bio";
import { BioCard } from "@/components/BioCard";

// Public link-in-bio pages, made fresh on every visit so an edit or a delete shows on every server at once.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const view = await publicBio((await params).slug);
  if (!view) return { title: "Not found", robots: { index: false } };
  return { title: view.title || "Links", description: view.bio.slice(0, 160) || undefined };
}

export default async function BioPage({ params }: { params: Promise<{ slug: string }> }) {
  const view = await publicBio((await params).slug);
  if (!view) notFound();
  return <BioCard view={view} />;
}
