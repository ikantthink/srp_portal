import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DomainSettingsForm } from "@/components/portal/super-admin/domain-settings-form";
import type { SiteSettings } from "@/types/database";

export default async function DomainSettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .single();

  const h = await headers();
  const currentHost = h.get("host");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Domain Settings</h1>
        <p className="text-muted-foreground">
          Configure the primary site domain and the short URL domain. Updates
          take effect within ~60 seconds without a redeploy.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Domains</CardTitle>
        </CardHeader>
        <CardContent>
          <DomainSettingsForm
            settings={settings as SiteSettings | null}
            currentHost={currentHost}
          />
        </CardContent>
      </Card>
    </div>
  );
}
