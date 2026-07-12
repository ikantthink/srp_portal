"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createNewsletter(formData: FormData) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: newsletter, error } = await supabase
    .from("newsletters")
    .insert({
      subject: formData.get("subject") as string,
      body_json: { blocks: [] },
      template_id: (formData.get("template_id") as string) || null,
      status: "draft",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal/newsletters");
  redirect(`/portal/newsletters/new?id=${newsletter.id}`);
}

export async function updateNewsletter(
  id: string,
  data: { subject?: string; body_json?: Record<string, unknown>; status?: string; scheduled_at?: string }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("newsletters")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/newsletters");
  return { success: true };
}

export async function sendNewsletter(id: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: newsletter } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single();

  if (!newsletter) return { error: "Newsletter not found" };

  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("email, name")
    .eq("status", "active");

  if (!subscribers?.length) return { error: "No active subscribers" };

  await supabase
    .from("newsletters")
    .update({ status: "sending" })
    .eq("id", id);

  // In production: use Resend batch API here
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // for (const sub of subscribers) {
  //   await resend.emails.send({ ... });
  // }

  await supabase
    .from("newsletters")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/portal/newsletters");
  return { success: true };
}
