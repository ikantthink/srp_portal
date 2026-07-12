import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShortUrlPrefix } from "@/types/database";

/** ponytail: rewrites legacy localhost targets saved during local dev */
function rewriteLocalhostTarget(url: string): string {
  try {
    const parsed = new URL(url);
    if (!/^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)) return url;
    const host = process.env.NEXT_PUBLIC_SHORT_DOMAIN?.trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
    if (!host) return url;
    return `https://${host}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

/**
 * Resolve a short URL by (prefix, code) and 302 to its target.
 *
 * Fire-and-forget click_count bump — wrapped in `Promise.resolve(...)` because
 * the Supabase RPC builder returns a `PromiseLike` without `.catch`. Errors are
 * swallowed so an analytics failure never blocks the redirect.
 *
 * Never returns: either calls `redirect()` (which throws) or `notFound()`.
 */
export async function resolveShortUrl(
  prefix: ShortUrlPrefix,
  code: string
): Promise<never> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("short_urls")
    .select("id, target_url")
    .eq("prefix", prefix)
    .eq("code", code)
    .single();

  if (!data) notFound();

  void Promise.resolve(
    supabase.rpc("increment_click_count", { short_url_id: data.id })
  ).catch(() => {});

  redirect(rewriteLocalhostTarget(data.target_url));
}
