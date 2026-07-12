import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GoogleReviewsSettings } from "@/components/portal/settings/google-reviews-settings";

export default async function GoogleReviewsPage() {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("api_configurations")
    .select("config")
    .eq("service", "google_reviews")
    .maybeSingle();

  const currentConfig = (row?.config as Record<string, unknown>) ?? {};

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Google Reviews</h1>
        <p className="text-muted-foreground">
          Credentials for the Testimonials block when using Google or Merge mode.
          Toggle the integration on/off in{" "}
          <a className="text-brand-primary hover:underline" href="/portal/super-admin/integrations">
            Integrations
          </a>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection</CardTitle>
          <CardDescription>
            Choose Places API for a quick setup, or Business Profile API for full review access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleReviewsSettings currentConfig={currentConfig} />
        </CardContent>
      </Card>
    </div>
  );
}
