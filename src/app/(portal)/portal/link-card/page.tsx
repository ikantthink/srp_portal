import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LinkCardEditor } from "@/components/portal/link-card/link-card-editor";

export default async function LinkCardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/portal");

  let { data: linkCard } = await supabase
    .from("link_cards")
    .select("*")
    .eq("agent_id", profile.id)
    .single();

  if (!linkCard) {
    const { data: created } = await supabase
      .from("link_cards")
      .insert({
        agent_id: profile.id,
        slug: profile.slug || `agent-${profile.id.slice(0, 8)}`,
      })
      .select()
      .single();
    linkCard = created;
  }

  if (!linkCard) redirect("/portal");

  let currentVersion = null;
  if (linkCard.current_version_id) {
    const { data } = await supabase
      .from("link_card_versions")
      .select("*")
      .eq("id", linkCard.current_version_id)
      .single();
    currentVersion = data;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Link Card</h1>
        <p className="text-muted-foreground">
          Your digital business card at{" "}
          <a href={`/c/${linkCard.slug}`} target="_blank" className="text-brand-primary hover:underline">
            /c/{linkCard.slug}
          </a>
        </p>
      </div>

      <LinkCardEditor
        linkCardId={linkCard.id}
        profile={profile}
        initialWidgets={currentVersion?.widgets || []}
        initialLayout={currentVersion?.layout || {}}
      />
    </div>
  );
}
