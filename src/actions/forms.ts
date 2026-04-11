"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

export async function createForm(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const slug = nanoid(10);

  const { data: form, error } = await supabase
    .from("forms")
    .insert({
      name: formData.get("name") as string,
      slug,
      status: "draft",
      created_by: profile!.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const { data: version } = await supabase
    .from("form_versions")
    .insert({
      form_id: form.id,
      version_number: 1,
      schema: { fields: [] },
      settings: {
        success_behavior: "message",
        success_message: "Thank you for your submission!",
      },
    })
    .select()
    .single();

  await supabase
    .from("forms")
    .update({ current_version_id: version!.id })
    .eq("id", form.id);

  revalidatePath("/portal/forms");
  redirect(`/portal/forms/${form.id}`);
}

export async function saveFormVersion(
  formId: string,
  data: {
    schema: Record<string, unknown>;
    page_data?: Record<string, unknown> | null;
    success_page_data?: Record<string, unknown> | null;
    settings: Record<string, unknown>;
  }
) {
  const supabase = await createClient();

  const { data: latestVersion } = await supabase
    .from("form_versions")
    .select("version_number")
    .eq("form_id", formId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestVersion?.version_number || 0) + 1;

  const { data: version, error } = await supabase
    .from("form_versions")
    .insert({
      form_id: formId,
      version_number: nextVersion,
      schema: data.schema,
      page_data: data.page_data || null,
      success_page_data: data.success_page_data || null,
      settings: data.settings,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("forms")
    .update({ current_version_id: version.id })
    .eq("id", formId);

  revalidatePath(`/portal/forms/${formId}`);
  return { success: true };
}

export async function publishForm(formId: string) {
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("current_version_id")
    .eq("id", formId)
    .single();

  if (form?.current_version_id) {
    await supabase
      .from("form_versions")
      .update({ published_at: new Date().toISOString() })
      .eq("id", form.current_version_id);
  }

  await supabase
    .from("forms")
    .update({ status: "published" })
    .eq("id", formId);

  revalidatePath(`/portal/forms/${formId}`);
  revalidatePath("/portal/forms");
  return { success: true };
}

export async function rollbackFormVersion(formId: string, versionId: string) {
  const supabase = await createClient();

  await supabase
    .from("forms")
    .update({ current_version_id: versionId })
    .eq("id", formId);

  revalidatePath(`/portal/forms/${formId}`);
  return { success: true };
}
