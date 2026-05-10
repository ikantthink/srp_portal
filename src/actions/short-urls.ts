"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { headers } from "next/headers";

export async function createShortUrl(targetUrl: string, title?: string) {
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

  const code = nanoid(7);

  const { data, error } = await supabase
    .from("short_urls")
    .insert({
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
    .single();

  if (existing) return { shortUrl: existing };

  const h = await headers();
  // headers().get('origin') is unreliable for same-origin server-action calls,
  // so build the canonical link-card URL from host + protocol forwarding hints.
  const host = h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const target = host ? `${proto}://${host}/c/${slug}` : `/c/${slug}`;
  const code = nanoid(7);

  const { data, error } = await supabase
    .from("short_urls")
    .insert({
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
