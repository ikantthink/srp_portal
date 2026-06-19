import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandingForm } from "@/components/portal/settings/branding-form";
import type { Role } from "@/types/database";

export default async function BrandingSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = (roleRow?.role as Role) || "user";
  if (role !== "admin" && role !== "super_admin") {
    redirect("/portal/settings");
  }

  const { data: brandSettings } = await supabase
    .from("brand_settings")
    .select("*")
    .limit(1)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Branding</h1>
        <p className="text-muted-foreground">
          Logos, colors, fonts, and sidebar theme for the portal and public website
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Brand Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandingForm settings={brandSettings} />
        </CardContent>
      </Card>
    </div>
  );
}
