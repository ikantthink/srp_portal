import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { INTEGRATIONS, getIntegrationDef, type IntegrationKey } from "./registry";

export interface IntegrationStatus {
  key: IntegrationKey;
  enabled: boolean;
  envOk: boolean;
  missingEnvVars: string[];
}

const loadFlags = cache(async (): Promise<Record<string, boolean>> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("feature_flags")
      .select("key, enabled");
    const map: Record<string, boolean> = {};
    for (const row of (data || []) as Array<{ key: string; enabled: boolean }>) {
      map[row.key] = !!row.enabled;
    }
    return map;
  } catch {
    return {};
  }
});

function checkEnv(envVars: string[]): { envOk: boolean; missing: string[] } {
  const missing = envVars.filter((name) => {
    const v = process.env[name];
    return !v || v.trim() === "" || v.startsWith("your_");
  });
  return { envOk: missing.length === 0, missing };
}

export async function getIntegrationStatus(
  key: IntegrationKey
): Promise<IntegrationStatus> {
  const def = getIntegrationDef(key);
  const flags = await loadFlags();
  const { envOk, missing } = checkEnv(def.envVars);
  const flag = flags[key];
  const enabled = flag === undefined ? def.defaultEnabled : flag;
  return { key, enabled, envOk, missingEnvVars: missing };
}

export async function getAllIntegrationStatuses(): Promise<IntegrationStatus[]> {
  return Promise.all(INTEGRATIONS.map((def) => getIntegrationStatus(def.key)));
}

/**
 * Single source of truth for runtime gating: integration is "live" only when
 * the super-admin toggle is on AND the env credentials it needs are present.
 */
export async function isIntegrationEnabled(key: IntegrationKey): Promise<boolean> {
  const status = await getIntegrationStatus(key);
  return status.enabled && status.envOk;
}
