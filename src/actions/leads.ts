"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLead(formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || null,
      source: (formData.get("source") as string) || "manual",
      status: "new",
      type: (formData.get("type") as string) || "buying",
      timeline: (formData.get("timeline") as string) || null,
      budget_min: formData.get("budget_min") ? Number(formData.get("budget_min")) : null,
      budget_max: formData.get("budget_max") ? Number(formData.get("budget_max")) : null,
      preferred_areas: (formData.get("preferred_areas") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal/leads");
  redirect(`/portal/leads/${lead.id}`);
}

export async function updateLead(id: string, formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || null,
      status: formData.get("status") as string,
      type: formData.get("type") as string,
      timeline: (formData.get("timeline") as string) || null,
      budget_min: formData.get("budget_min") ? Number(formData.get("budget_min")) : null,
      budget_max: formData.get("budget_max") ? Number(formData.get("budget_max")) : null,
      preferred_areas: (formData.get("preferred_areas") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/portal/leads/${id}`);
  revalidatePath("/portal/leads");
  return { success: true };
}

export async function addLeadActivity(leadId: string, formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    type: formData.get("type") as string,
    description: formData.get("description") as string,
    created_by: profile?.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/portal/leads/${leadId}`);
  return { success: true };
}

export async function updateLeadStatus(id: string, status: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/leads");
  revalidatePath(`/portal/leads/${id}`);
  return { success: true };
}
