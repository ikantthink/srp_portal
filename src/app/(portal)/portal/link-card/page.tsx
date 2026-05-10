import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LinkCardEditor } from "@/components/portal/link-card/link-card-editor";
import { createLinkCardShortUrl } from "@/actions/short-urls";
import { LinkCardShortUrl } from "@/components/portal/link-card/link-card-short-url";
import { getShortDomain } from "@/lib/site-settings";

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

  const { data: publishedForms } = await supabase
    .from("forms")
    .select("id, name, slug")
    .eq("status", "published");

  const { data: existingShortUrl } = await supabase
    .from("short_urls")
    .select("*")
    .eq("link_card_id", linkCard.id)
    .single();

  let shortUrlCode = existingShortUrl?.code;
  if (!existingShortUrl) {
    const result = await createLinkCardShortUrl(linkCard.id, linkCard.slug);
    if (result.shortUrl) {
      shortUrlCode = result.shortUrl.code;
    }
  }

  const configuredShortDomain = await getShortDomain();
  const h = await headers();
  const shareHost = configuredShortDomain ?? h.get("host") ?? "";

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
        {shortUrlCode && shareHost && (
          <LinkCardShortUrl code={shortUrlCode} shortDomain={shareHost} />
        )}
      </div>

      <LinkCardEditor
        linkCardId={linkCard.id}
        profile={profile}
        initialWidgets={currentVersion?.widgets || []}
        initialLayout={currentVersion?.layout || {}}
        forms={publishedForms || []}
      />
    </div>
  );
}
