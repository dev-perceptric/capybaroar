import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicBio } from "@/lib/bio";
import { BioCard } from "@/components/BioCard";

// Public link-in-bio pages. Made on the first visit and kept for a minute (the response says so in its cache
// headers); saving the page in the editor makes a fresh one at once on that server.
export const revalidate = 60;
export const generateStaticParams = async () => [];

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
