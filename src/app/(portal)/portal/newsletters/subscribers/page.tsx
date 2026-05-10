import { createClient } from "@/lib/supabase/server";
import { SubscribersTable } from "@/components/portal/newsletters/subscribers-table";

export default async function SubscribersPage() {
  const supabase = await createClient();

  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>
        <p className="text-muted-foreground">Manage newsletter subscribers</p>
      </div>

      <SubscribersTable data={subscribers || []} />
    </div>
  );
}
