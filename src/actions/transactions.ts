"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      property_address: formData.get("property_address") as string,
      type: formData.get("type") as string,
      status: formData.get("status") as string || "active",
      list_price: formData.get("list_price") ? Number(formData.get("list_price")) : null,
      sale_price: formData.get("sale_price") ? Number(formData.get("sale_price")) : null,
      listing_date: (formData.get("listing_date") as string) || null,
      closing_date: (formData.get("closing_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const milestones = [
    "listing", "offer_received", "offer_accepted", "inspection",
    "appraisal", "title_search", "financing", "final_walkthrough", "closing",
  ];

  await supabase.from("transaction_milestones").insert(
    milestones.map((m) => ({ transaction_id: transaction.id, milestone: m }))
  );

  revalidatePath("/portal/transactions");
  redirect(`/portal/transactions/${transaction.id}`);
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("transactions")
    .update({
      property_address: formData.get("property_address") as string,
      type: formData.get("type") as string,
      status: formData.get("status") as string,
      list_price: formData.get("list_price") ? Number(formData.get("list_price")) : null,
      sale_price: formData.get("sale_price") ? Number(formData.get("sale_price")) : null,
      listing_date: (formData.get("listing_date") as string) || null,
      closing_date: (formData.get("closing_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/portal/transactions/${id}`);
  revalidatePath("/portal/transactions");
  return { success: true };
}

export async function updateMilestone(
  id: string,
  data: { status: string; completed_date?: string | null; notes?: string }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("transaction_milestones")
    .update({
      status: data.status,
      completed_date: data.status === "completed" ? data.completed_date || new Date().toISOString().split("T")[0] : null,
      notes: data.notes,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/transactions");
  return { success: true };
}

export async function addParty(transactionId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("transaction_parties").insert({
    transaction_id: transactionId,
    role: formData.get("role") as string,
    name: formData.get("name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    company: (formData.get("company") as string) || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/portal/transactions/${transactionId}`);
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/portal/transactions");
  redirect("/portal/transactions");
}
