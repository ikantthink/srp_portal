/**
 * Display-only domain configuration loaded from the `site_settings` singleton.
 *
 * Only used so the portal can render share URLs like `srp.onl/c/<code>` instead
 * of falling back to whatever host the request happened to arrive on. There is
 * no host-based middleware behavior — every domain serves the same app and
 * `/c/<x>` is the unified short-URL + link-card route.
 *
 * Read-path goes through Next's fetch cache (tag: SITE_SETTINGS_TAG); the save
 * action calls `revalidateTag(SITE_SETTINGS_TAG)` so changes propagate within
 * seconds without a redeploy.
 */

export const SITE_SETTINGS_TAG = "site-settings";

/**
 * Returns the configured short domain (host only, no protocol), or `null` if
 * unset. Falls back to NEXT_PUBLIC_SHORT_DOMAIN as a bootstrap value when the
 * DB row is empty.
 */
export async function getShortDomain(): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return envFallback();

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?select=short_domain&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Accept: "application/json",
        },
        next: { revalidate: 60, tags: [SITE_SETTINGS_TAG] },
      }
    );

    if (!res.ok) return envFallback();

    const rows = (await res.json()) as Array<{ short_domain: string | null }>;
    const value = normalize(rows[0]?.short_domain ?? null);
    return value ?? envFallback();
  } catch {
    return envFallback();
  }
}

function envFallback(): string | null {
  return normalize(process.env.NEXT_PUBLIC_SHORT_DOMAIN);
}

function normalize(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return trimmed || null;
}
