"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/supabase/require-auth";
import { getIntegrationDef, type IntegrationKey } from "@/lib/integrations/registry";

export async function setIntegrationEnabled(
  key: IntegrationKey,
  enabled: boolean
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error };

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
