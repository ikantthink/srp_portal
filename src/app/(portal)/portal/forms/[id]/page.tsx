import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { FormBuilderTabs } from "@/components/portal/forms/form-builder-tabs";

export default async function FormEditorPage({
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

  const { data: version } = form.current_version_id
    ? await supabase
        .from("form_versions")
        .select("*")
        .eq("id", form.current_version_id)
        .single()
    : { data: null };

  const { data: submissions } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("form_id", id)
    .order("submitted_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{form.name}</h1>
          <p className="text-sm text-muted-foreground">/f/{form.slug}</p>
        </div>
        <Badge variant={form.status === "published" ? "success" : "secondary"}>
          {form.status}
        </Badge>
      </div>

      <FormBuilderTabs
        formId={form.id}
        formStatus={form.status}
        version={version}
        submissions={submissions || []}
      />
    </div>
  );
}
