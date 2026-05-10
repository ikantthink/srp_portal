"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface BlockPreset {
  id: string;
  name: string;
  component_type: string;
  folder: string;
  props: Record<string, unknown>;
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function listBlockPresets(): Promise<BlockPreset[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("puck_block_presets")
    .select("*")
    .order("folder")
    .order("name");
  return (data || []) as BlockPreset[];
}

export async function createBlockPreset(input: {
  name: string;
  component_type: string;
  folder: string;
  props: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { data, error } = await supabase
    .from("puck_block_presets")
    .insert({
      name: input.name,
      component_type: input.component_type,
      folder: input.folder,
      props: input.props,
      created_by: profile?.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal/settings/block-presets");
  return { data: data as BlockPreset };
}

export async function updateBlockPreset(
  id: string,
  input: {
    name?: string;
    folder?: string;
    props?: Record<string, unknown>;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("puck_block_presets")
    .update(input)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/settings/block-presets");
  return { success: true };
}

export async function deleteBlockPreset(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("puck_block_presets")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/settings/block-presets");
  return { success: true };
}
