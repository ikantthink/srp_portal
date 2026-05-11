import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShortUrlPrefix } from "@/types/database";

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

  redirect(data.target_url);
}
