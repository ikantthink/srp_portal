import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TemplatesPage() {
  const supabase = await createClient();

  const { data: emailTemplates } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: smsTemplates } = await supabase
    .from("sms_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Templates</h1>

      <Card>
        <CardHeader><CardTitle>Email Templates</CardTitle></CardHeader>
        <CardContent>
          {emailTemplates?.length ? (
            <div className="space-y-3">
              {emailTemplates.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.subject}</p>
                  </div>
                  <Badge variant="secondary">{t.type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No email templates yet. Templates can be managed by admins.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SMS Templates</CardTitle></CardHeader>
        <CardContent>
          {smsTemplates?.length ? (
            <div className="space-y-3">
              {smsTemplates.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-md">{t.body}</p>
                  </div>
                  <Badge variant="secondary">{t.type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No SMS templates yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
