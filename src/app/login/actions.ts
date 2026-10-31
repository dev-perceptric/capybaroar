"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { userClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; sent?: boolean };

const origin = async () => {
  const h = await headers();
  return process.env.APP_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
};

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const sb = await userClient();
  const { error } = await sb.auth.signInWithPassword({ email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") });
  if (error) return { error: error.message };
  redirect("/calendar");
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const sb = await userClient();
  const email = String(form.get("email") ?? "");
  const { data, error } = await sb.auth.signUp({
    email,
    password: String(form.get("password") ?? ""),
    options: {
      data: { name: String(form.get("name") ?? "").trim(), company: String(form.get("company") ?? "").trim() },
      emailRedirectTo: `${await origin()}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) return { sent: true };
  redirect("/calendar");
}

export async function signInWithGoogle() {
  const sb = await userClient();
  const { data, error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${await origin()}/auth/callback` } });
  if (error) throw new Error(error.message);
  redirect(data.url);
}

export async function signOut() {
  const sb = await userClient();
  await sb.auth.signOut();
  redirect("/login");
}
