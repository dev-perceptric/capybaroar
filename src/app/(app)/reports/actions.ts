"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { writerCtx } from "@/lib/session";
import { deleteReport, saveReport, sendReportNow, type ReportInput } from "@/lib/reports";

const fail = (e: unknown) => {
  unstable_rethrow(e);
  return { error: e instanceof Error ? e.message : String(e) };
};

export async function saveReportAction(id: string | null, input: ReportInput): Promise<{ error?: string; id?: string }> {
  let saved: string;
  try {
    saved = await saveReport(await writerCtx(), id, input);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/reports");
  return { id: saved };
}

export async function removeReport(id: string): Promise<{ error?: string }> {
  try {
    await deleteReport(await writerCtx(), id);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/reports");
  return {};
}

export async function sendNow(id: string): Promise<{ error?: string }> {
  try {
    await sendReportNow(await writerCtx(), id);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/reports");
  return {};
}
