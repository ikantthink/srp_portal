"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-auth";
import { revalidatePath } from "next/cache";

export async function saveLinkCardVersion(
  linkCardId: string,
  data: { layout: Record<string, unknown>; widgets: Record<string, unknown>[] }
) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { data: latest } = await supabase
    .from("link_card_versions")
    .select("version_number")
    .eq("link_card_id", linkCardId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latest?.version_number || 0) + 1;

  const { data: version, error } = await supabase
    .from("link_card_versions")
    .insert({
      link_card_id: linkCardId,
      version_number: nextVersion,
      layout: data.layout,
      widgets: data.widgets,
      published_at: new Date().toISOString(),
      created_by: profile!.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("link_cards")
    .update({ current_version_id: version.id })
    .eq("id", linkCardId);

  revalidatePath("/portal/link-card");
  return { success: true };
}

export async function rollbackLinkCardVersion(linkCardId: string, versionId: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  await supabase
    .from("link_cards")
    .update({ current_version_id: versionId })
    .eq("id", linkCardId);

  revalidatePath("/portal/link-card");
  return { success: true };
}

export async function ensureLinkCard() {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, slug")
    .eq("user_id", user!.id)
    .single();

  if (!profile) return { error: "No profile found" };

  const { data: existing } = await supabase
    .from("link_cards")
    .select("*")
    .eq("agent_id", profile.id)
    .single();

  if (existing) return { linkCard: existing };

  const { data: created, error } = await supabase
    .from("link_cards")
    .insert({
      agent_id: profile.id,
      slug: profile.slug || `agent-${profile.id.slice(0, 8)}`,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  return { linkCard: created };
}
