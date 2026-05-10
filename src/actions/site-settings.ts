"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SITE_SETTINGS_TAG } from "@/lib/site-settings";

function normalizeHost(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  // Allow localhost, localhost:PORT, or any FQDN-looking thing (with optional port).
  if (!/^([a-z0-9-]+(\.[a-z0-9-]+)*)(:\d+)?$/i.test(stripped)) {
    return null;
  }
  return stripped.toLowerCase();
}

export async function updateSiteSettings(input: { short_domain: string | null }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (roleRow?.role !== "super_admin") {
    return { error: "Only super admins can edit domain settings" };
  }

  const short = normalizeHost(input.short_domain);
  if (input.short_domain && !short) {
    return { error: "Short domain doesn't look like a valid host" };
  }

  const { data: existing } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .single();

  if (existing?.id) {
    const { error } = await supabase
      .from("site_settings")
      .update({ short_domain: short })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("site_settings")
      .insert({ short_domain: short });
    if (error) return { error: error.message };
  }

  revalidateTag(SITE_SETTINGS_TAG);
  return { success: true, short_domain: short };
}
