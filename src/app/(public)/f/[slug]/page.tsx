import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PublicFormRenderer } from "@/components/portal/forms/public-form-renderer";

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { slug } = await params;
  const { embed } = await searchParams;
  const supabase = createAdminClient();

  const { data: form } = await supabase
    .from("forms")
    .select("*, form_versions(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!form) notFound();

  const version = form.current_version_id
    ? (form as any).form_versions?.find((v: any) => v.id === form.current_version_id)
    : null;

  if (!version) notFound();

  const isEmbed = embed === "true";

  return (
    <PublicFormRenderer
      formId={form.id}
      versionId={version.id}
      schema={version.schema}
      pageData={version.page_data}
      successPageData={version.success_page_data}
      settings={version.settings}
      isEmbed={isEmbed}
    />
  );
}
