import { createClient } from "@/lib/supabase/server";
import { FormTable, type FormRow } from "@/components/portal/forms/form-table";
import { FormCreateDialog } from "@/components/portal/forms/form-create-dialog";

export default async function FormsPage() {
  const supabase = await createClient();

  const { data: forms } = await supabase
    .from("forms")
    .select("*, form_submissions(count)")
    .order("created_at", { ascending: false });

  const rows: FormRow[] = (forms || []).map((form) => ({
    id: form.id,
    name: form.name,
    slug: form.slug,
    status: form.status,
    created_at: form.created_at,
    submission_count:
      (form.form_submissions as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
        <p className="text-muted-foreground">Build, publish, and manage forms</p>
      </div>

      <FormTable data={rows} toolbar={<FormCreateDialog />} />
    </div>
  );
}
