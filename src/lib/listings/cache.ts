import { createAdminClient } from "@/lib/supabase/admin";
import type { Listing } from "./provider";

const TTL_MINUTES = 60;

export async function getCachedListing(listingId: string): Promise<Listing | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("idx_listings_cache")
    .select("data")
    .eq("listing_id", listingId)
    .gt("expires_at", new Date().toISOString())
    .single();

  return data?.data as Listing | null;
}

export async function setCachedListing(
  listingId: string,
  data: Listing,
  source: "idx_broker" | "reso"
) {
  const supabase = createAdminClient();
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString();

  await supabase.from("idx_listings_cache").upsert(
    { listing_id: listingId, data, source, fetched_at: new Date().toISOString(), expires_at: expiresAt },
    { onConflict: "listing_id" }
  );
}
