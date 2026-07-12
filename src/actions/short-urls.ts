"use server";

import { createClient } from "@/lib/supabase/server";
import { getShortDomain } from "@/lib/site-settings";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShortUrlPrefix } from "@/types/database";

/**
 * Generate a unique 4-char code within a prefix pool, retrying a few times on
 * collision. Birthday-paradox math says a 64-alphabet 4-char pool starts
 * colliding around ~5K codes; on the rare retry-exhaustion case we bump to
 * length 6 (~68B combos) as a safety valve rather than failing the insert.
 */
async function generateCode(
  supabase: SupabaseClient,
  prefix: ShortUrlPrefix
): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = nanoid(4);
    const { data } = await supabase
      .from("short_urls")
      .select("id")
      .eq("prefix", prefix)
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
  return nanoid(6);
}

function isAllowedTargetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createShortUrl(targetUrl: string, title?: string) {
  if (!isAllowedTargetUrl(targetUrl)) {
    return { error: "Target URL must use http or https" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "No profile found" };

  const code = await generateCode(supabase, "s");

  const { data, error } = await supabase
    .from("short_urls")
    .insert({
      prefix: "s",
      code,
      target_url: targetUrl,
      title: title || null,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal/url-shortener");
  return { shortUrl: data };
}

export async function updateShortUrl(
  id: string,
  targetUrl: string,
  title?: string
) {
  if (!isAllowedTargetUrl(targetUrl)) {
    return { error: "Target URL must use http or https" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("short_urls")
    .update({
      target_url: targetUrl,
      title: title || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal/url-shortener");
  return { shortUrl: data };
}

export async function deleteShortUrl(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("short_urls").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/url-shortener");
  return { success: true };
}

export async function createLinkCardShortUrl(
  linkCardId: string,
  slug: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "No profile found" };

  const { data: existing } = await supabase
    .from("short_urls")
    .select("*")
    .eq("link_card_id", linkCardId)
    .maybeSingle();

  if (existing) return { shortUrl: existing };

  const configuredDomain = await getShortDomain();
  const h = await headers();
  const host = configuredDomain ?? h.get("host") ?? "";
  const proto = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)
    ? "http"
    : "https";
  const target = host ? `${proto}://${host}/c/${slug}` : `/c/${slug}`;
  const code = await generateCode(supabase, "l");

  const { data, error } = await supabase
    .from("short_urls")
    .insert({
      prefix: "l",
      code,
      target_url: target,
      title: `Link Card: ${slug}`,
      created_by: profile.id,
      link_card_id: linkCardId,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  return { shortUrl: data };
}
