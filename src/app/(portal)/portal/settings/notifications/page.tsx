import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationSettings } from "@/components/portal/settings/notification-settings";

const eventTypes = [
  { key: "new_lead", label: "New Lead" },
  { key: "form_submission", label: "Form Submission" },
  { key: "transaction_update", label: "Transaction Update" },
  { key: "newsletter_subscriber", label: "New Subscriber" },
];

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: settings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <CardContent>
          <NotificationSettings
            userId={user.id}
            eventTypes={eventTypes}
            currentSettings={settings || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
