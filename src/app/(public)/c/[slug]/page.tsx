import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { LinkCardPreview } from "@/components/portal/link-card/link-card-preview";
import type { Profile } from "@/types/database";

export default async function PublicLinkCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: linkCard } = await supabase
    .from("link_cards")
    .select("*, link_card_versions(*)")
    .eq("slug", slug)
    .single();

  if (!linkCard) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", linkCard.agent_id)
    .single();

  if (!profile) notFound();

  const version = linkCard.current_version_id
    ? (linkCard as any).link_card_versions?.find(
        (v: any) => v.id === linkCard.current_version_id
      )
    : null;

  const widgets = version?.widgets || [];

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <LinkCardPreview
        profile={profile as Profile}
        widgets={widgets}
      />
    </div>
  );
}
