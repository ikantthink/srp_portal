import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LeadTable } from "@/components/portal/leads/lead-table";
import { LeadCreateDialog } from "@/components/portal/leads/lead-create-dialog";

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage your CRM pipeline</p>
        </div>
        <LeadCreateDialog />
      </div>

      <LeadTable data={leads || []} />
    </div>
  );
}
