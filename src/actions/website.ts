"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPage(formData: FormData) {
  const supabase = await createClient();

  const { data: page, error } = await supabase
    .from("website_pages")
    .insert({
      title: formData.get("title") as string,
      slug: (formData.get("slug") as string).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      meta_description: (formData.get("meta_description") as string) || null,
      puck_data: { content: [], root: { props: {} } },
      status: "draft",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal/website");
  redirect(`/portal/website/pages/${page.id}`);
}

export async function savePageData(id: string, puckData: Record<string, unknown>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("website_pages")
    .update({ puck_data: puckData })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/website");
  return { success: true };
}

export async function publishPage(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("website_pages")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/website");
  return { success: true };
}

export async function deletePage(id: string) {
  const supabase = await createClient();
  await supabase.from("website_pages").delete().eq("id", id);
  revalidatePath("/portal/website");
  redirect("/portal/website");
}
