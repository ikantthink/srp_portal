import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UrlShortenerManager } from "@/components/portal/url-shortener/url-shortener-manager";
import { getShortDomain } from "@/lib/site-settings";

export default async function UrlShortenerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/portal");

  const { data: shortUrls } = await supabase
    .from("short_urls")
    .select("*")
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  const configuredShortDomain = await getShortDomain();
  const h = await headers();
  const shareHost = configuredShortDomain ?? h.get("host") ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">URL Shortener</h1>
        <p className="text-muted-foreground">
          Create and manage short links via{" "}
          <span className="font-medium text-foreground">
            {shareHost || "your domain"}
          </span>
        </p>
      </div>

      <UrlShortenerManager
        shortUrls={shortUrls || []}
        shortDomain={shareHost}
      />
    </div>
  );
}
