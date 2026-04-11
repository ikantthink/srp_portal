import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormVersionHistory } from "@/components/portal/forms/form-version-history";

export default async function FormHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .single();

  if (!form) notFound();

  const { data: versions } = await supabase
    .from("form_versions")
    .select("*")
    .eq("form_id", id)
    .order("version_number", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{form.name} - Version History</h1>
        <p className="text-sm text-muted-foreground">/f/{form.slug}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <FormVersionHistory
            formId={form.id}
            currentVersionId={form.current_version_id}
            versions={versions || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
