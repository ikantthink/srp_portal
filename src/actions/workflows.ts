"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-auth";
import { revalidatePath } from "next/cache";
import type { Workflow, WorkflowStage } from "@/types/database";

export async function listWorkflows(entityType: string): Promise<Workflow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workflows")
    .select("*")
    .eq("entity_type", entityType);
  return (data as Workflow[]) || [];
}

export async function getWorkflowWithStages(entityType: string) {
  const supabase = await createClient();
  const { data: workflow } = await supabase
    .from("workflows")
    .select("*")
    .eq("entity_type", entityType)
    .single();
  if (!workflow) return null;

  const { data: stages } = await supabase
    .from("workflow_stages")
    .select("*")
    .eq("workflow_id", workflow.id)
    .order("position");

  return {
    ...(workflow as Workflow),
    stages: (stages as WorkflowStage[]) || [],
  };
}

export async function createWorkflowStage(
  workflowId: string,
  name: string,
  color: string,
  position: number
) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflow_stages")
    .insert({ workflow_id: workflowId, name, color, position })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/portal/leads");
  return { data };
}

export async function updateWorkflowStage(
  id: string,
  updates: { name?: string; color?: string; position?: number }
) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workflow_stages")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/leads");
  return { success: true };
}

export async function deleteWorkflowStage(id: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workflow_stages")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/leads");
  return { success: true };
}

export async function reorderWorkflowStages(
  workflowId: string,
  stageIds: string[]
) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  for (let i = 0; i < stageIds.length; i++) {
    const { error } = await supabase
      .from("workflow_stages")
      .update({ position: i })
      .eq("id", stageIds[i])
      .eq("workflow_id", workflowId);
    if (error) return { error: error.message };
  }
  revalidatePath("/portal/leads");
  return { success: true };
}

export async function updateLeadWorkflowStage(leadId: string, stageId: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ workflow_stage_id: stageId })
    .eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/portal/leads");
  return { success: true };
}
