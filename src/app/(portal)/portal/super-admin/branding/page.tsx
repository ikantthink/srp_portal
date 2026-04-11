import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandingForm } from "@/components/portal/settings/branding-form";

export default async function BrandingPage() {
  const supabase = await createClient();

  const { data: brandSettings } = await supabase
    .from("brand_settings")
    .select("*")
    .limit(1)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brand Settings</h1>
        <p className="text-muted-foreground">
          Configure logos, colors, and fonts for the portal and public website
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandingForm settings={brandSettings} />
        </CardContent>
      </Card>
    </div>
  );
}
