"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isIntegrationEnabled } from "@/lib/integrations/status";

function siteUrl(): string | null {
  return process.env.NEXT_PUBLIC_SITE_URL || null;
}

export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/portal");
}

export async function signInWithMagicLink(formData: FormData) {
  const origin = siteUrl();
  if (!origin) return { error: "Site URL not configured" };

  const supabase = await createClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email for a login link." };
}

export async function signInWithGoogle() {
  if (!(await isIntegrationEnabled("google_login"))) {
    return { error: "Google sign-in is currently disabled." };
  }

  const origin = siteUrl();
  if (!origin) return { error: "Site URL not configured" };

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
