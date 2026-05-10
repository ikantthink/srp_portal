import { createClient } from "@/lib/supabase/server";
import { LeadsPageTabs } from "@/components/portal/leads/leads-page-tabs";
import { LeadCreateDialog } from "@/components/portal/leads/lead-create-dialog";
import type { Lead, LeadTag, WorkflowStage } from "@/types/database";

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: rawLeads } = await supabase
    .from("leads")
    .select("*, workflow_stages(*), lead_tag_assignments(lead_tags(*))")
    .order("created_at", { ascending: false });

  const leads: Lead[] = (rawLeads || []).map((lead) => {
    const tagAssignments = (lead.lead_tag_assignments || []) as Array<{
      lead_tags: LeadTag;
    }>;
    return {
      ...lead,
      tags: tagAssignments.map((a) => a.lead_tags).filter(Boolean),
      workflow_stage: lead.workflow_stages as WorkflowStage | null,
    } as Lead;
  });

  const { data: tags } = await supabase
    .from("lead_tags")
    .select("*")
    .order("name");

  const { data: workflow } = await supabase
    .from("workflows")
    .select("*")
    .eq("entity_type", "lead")
    .single();

  const { data: stages } = workflow
    ? await supabase
        .from("workflow_stages")
        .select("*")
        .eq("workflow_id", workflow.id)
        .order("position")
    : { data: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">Manage your CRM pipeline</p>
      </div>

      <LeadsPageTabs
        leads={leads}
        tags={(tags as LeadTag[]) || []}
        workflowId={workflow?.id || ""}
        stages={(stages as WorkflowStage[]) || []}
        toolbar={<LeadCreateDialog />}
      />
    </div>
  );
}
