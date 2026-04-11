import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkCardVersionHistory } from "@/components/portal/link-card/link-card-version-history";

export default async function LinkCardHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: linkCard } = await supabase
    .from("link_cards")
    .select("*")
    .eq("agent_id", profile!.id)
    .single();

  if (!linkCard) redirect("/portal/link-card");

  const { data: versions } = await supabase
    .from("link_card_versions")
    .select("*")
    .eq("link_card_id", linkCard.id)
    .order("version_number", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Link Card History</h1>
        <p className="text-muted-foreground">/c/{linkCard.slug}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Versions</CardTitle></CardHeader>
        <CardContent>
          <LinkCardVersionHistory
            linkCardId={linkCard.id}
            currentVersionId={linkCard.current_version_id}
            versions={versions || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
