import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/portal/settings/profile-form";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
      <Card>
        <CardHeader><CardTitle>Your Profile</CardTitle></CardHeader>
        <CardContent>
          <ProfileForm profile={profile!} />
        </CardContent>
      </Card>
    </div>
  );
}
