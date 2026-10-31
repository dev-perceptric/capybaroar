import { createBrowserClient } from "@supabase/ssr";

/** The browser's client, used for direct uploads with one-time links. */
export const browserClient = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
