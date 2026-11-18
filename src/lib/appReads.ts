import "server-only";
import { channelGroups, composerData, loadCampaigns, loadComments, loadPosts, loadResults } from "@/app/(app)/calendar/actions";
import { loadThread, loadThreads } from "@/app/(app)/inbox/actions";
import { generationsStatus } from "@/app/(app)/media/actions";
import { recentChats } from "@/app/(app)/agents/actions";

// Reads the app's screens make while open (polls, opening the composer, picking a thread). Next runs server actions one
// at a time per tab, so a read sent as an action waited behind any save (and the agent's long turns), and a save waited
// behind the reads. These go through GET /api/app/<name> instead (src/app/api/app/[read]/route.ts, src/lib/read.ts):
// they run side by side and never hold up a save. Each is the same function the action was, with the same checks
// (getCtx, brand scope, access). Only reads belong here: nothing that changes data.
export const READS = { loadPosts, loadCampaigns, composerData, loadComments, loadResults, channelGroups, loadThread, loadThreads, generationsStatus, recentChats };

export type Reads = typeof READS;
export type ReadName = keyof Reads;
