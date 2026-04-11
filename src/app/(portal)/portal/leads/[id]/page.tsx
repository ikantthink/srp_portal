import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadDetailForm } from "@/components/portal/leads/lead-detail-form";
import { ActivityLog } from "@/components/portal/leads/activity-log";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (!lead) notFound();

  const { data: activities } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge>{lead.status.replace("_", " ")}</Badge>
          <span className="text-sm capitalize text-muted-foreground">{lead.type}</span>
          <span className="text-sm text-muted-foreground">via {lead.source.replace("_", " ")}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadDetailForm lead={lead} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityLog leadId={lead.id} activities={activities || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
