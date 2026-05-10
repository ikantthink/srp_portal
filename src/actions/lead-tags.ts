"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LeadTag } from "@/types/database";

export async function listLeadTags(): Promise<LeadTag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_tags")
    .select("*")
    .order("name");
  return (data as LeadTag[]) || [];
}

export async function createLeadTag(name: string, color: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_tags")
    .insert({ name, color })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/portal/leads");
  return { data };
}

export async function updateLeadTag(id: string, name: string, color: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_tags")
    .update({ name, color })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/leads");
  return { success: true };
}

export async function deleteLeadTag(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_tags")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/leads");
  return { success: true };
}

export async function addTagToLead(leadId: string, tagId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_tag_assignments")
    .insert({ lead_id: leadId, tag_id: tagId });
  if (error && !error.message.includes("duplicate")) return { error: error.message };
  revalidatePath("/portal/leads");
  return { success: true };
}

export async function removeTagFromLead(leadId: string, tagId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_tag_assignments")
    .delete()
    .eq("lead_id", leadId)
    .eq("tag_id", tagId);
  if (error) return { error: error.message };
  revalidatePath("/portal/leads");
  return { success: true };
}
