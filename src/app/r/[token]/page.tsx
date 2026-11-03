import type { Metadata } from "next";
import { cache } from "react";
import { connection } from "next/server";
import { reportForToken } from "@/lib/reports";
import { ReportView } from "@/components/ReportView";
import { InviteCard } from "@/components/InviteCard";

const load = cache((token: string) => reportForToken(token));

// The title is the saved PDF's file name.
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  await connection();
  const r = await load((await params).token);
  return { title: r ? `${r.title} ${r.name}, ${r.period}` : "Report", robots: { index: false, follow: false } };
}

export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  await connection(); // always today's numbers
  const report = await load((await params).token);
  if (!report) return <InviteCard title="This report link was turned off" line="Ask for a new one." />;
  return <ReportView report={report} />;
}
