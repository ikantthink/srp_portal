"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getIntegrationDef, type IntegrationKey } from "@/lib/integrations/registry";

export async function setIntegrationEnabled(
  key: IntegrationKey,
  enabled: boolean
): Promise<{ error?: string; success?: boolean }> {
  // Validates the key exists.
  getIntegrationDef(key);

  const supabase = await createClient();
  const { error } = await supabase
    .from("feature_flags")
    .upsert({ key, enabled }, { onConflict: "key" });

  if (error) return { error: error.message };

  revalidatePath("/portal/super-admin/integrations");
  return { success: true };
}
