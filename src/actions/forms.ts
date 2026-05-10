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

  const { data: form } = await supabase
    .from("forms")
    .select("current_version_id, published_version_id, status")
    .eq("id", formId)
    .single();

  if (!form) return { error: "Form not found" };

  const isPublished = form.status === "published";
  const currentIsPublished =
    isPublished && form.current_version_id === form.published_version_id;

  // If the form has never been published, or the current draft isn't the
  // published version, just update the existing version row in place.
  if (form.current_version_id && !currentIsPublished) {
    const { error } = await supabase
      .from("form_versions")
      .update({
        schema: data.schema,
        page_data: data.page_data || null,
        success_page_data: data.success_page_data || null,
        settings: data.settings,
      })
      .eq("id", form.current_version_id);

    if (error) return { error: error.message };

    revalidatePath(`/portal/forms/${formId}`);
    return { success: true, versionId: form.current_version_id };
  }

  // The current version IS the published version -- we need to fork a new
  // draft so the live form stays untouched until the next publish.
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
      status: "draft",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("forms")
    .update({ current_version_id: version.id })
    .eq("id", formId);

  revalidatePath(`/portal/forms/${formId}`);
  return { success: true, versionId: version.id };
}

export async function publishForm(formId: string) {
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("current_version_id")
    .eq("id", formId)
    .single();

  if (!form?.current_version_id) {
    return { error: "No version to publish" };
  }

  await supabase
    .from("form_versions")
    .update({
      published_at: new Date().toISOString(),
      status: "published",
    })
    .eq("id", form.current_version_id);

  await supabase
    .from("forms")
    .update({
      status: "published",
      published_version_id: form.current_version_id,
    })
    .eq("id", formId);

  revalidatePath(`/portal/forms/${formId}`);
  revalidatePath("/portal/forms");
  return { success: true };
}

export async function publishSpecificVersion(formId: string, versionId: string) {
  const supabase = await createClient();

  await supabase
    .from("form_versions")
    .update({
      published_at: new Date().toISOString(),
      status: "published",
    })
    .eq("id", versionId);

  await supabase
    .from("forms")
    .update({
      status: "published",
      published_version_id: versionId,
    })
    .eq("id", formId);

  revalidatePath(`/portal/forms/${formId}`);
  revalidatePath("/portal/forms");
  return { success: true };
}

export async function deleteForm(formId: string) {
  const supabase = await createClient();

  await supabase
    .from("forms")
    .update({ current_version_id: null, published_version_id: null })
    .eq("id", formId);

  await supabase.from("form_versions").delete().eq("form_id", formId);
  await supabase.from("forms").delete().eq("id", formId);

  revalidatePath("/portal/forms");
  redirect("/portal/forms");
}

export async function loadVersionIntoDraft(formId: string, versionId: string) {
  const supabase = await createClient();

  await supabase
    .from("forms")
    .update({ current_version_id: versionId })
    .eq("id", formId);

  revalidatePath(`/portal/forms/${formId}`);
  return { success: true };
}
