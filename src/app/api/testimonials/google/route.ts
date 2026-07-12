import { NextResponse } from "next/server";
import { isIntegrationEnabled } from "@/lib/integrations/status";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeBusinessProfileReviews,
  normalizePlacesNewReviews,
  type TestimonialReview,
} from "@/lib/testimonials/reviews";

export const revalidate = 900;

type ReviewSource = "places" | "business_profile";

interface ReviewsResponse {
  reviews: TestimonialReview[];
  source?: ReviewSource;
  error?: string;
}

function ok(body: ReviewsResponse) {
  return NextResponse.json(body, { status: 200 });
}

async function loadConfig(): Promise<Record<string, string>> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("api_configurations")
    .select("config")
    .eq("service", "google_reviews")
    .maybeSingle();
  return (data?.config as Record<string, string>) ?? {};
}

async function fetchPlacesReviews(apiKey: string, placeId: string): Promise<TestimonialReview[]> {
  // Places API (New). The legacy maps/api/place/details endpoint is not enabled
  // for newly-created keys and returns LegacyApiNotActivatedMapError.
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "reviews",
    },
    next: { revalidate: 900 },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Places API failed: ${res.status}`);
  }
  const json = (await res.json()) as {
    reviews?: Array<{
      rating?: number;
      text?: { text?: string };
      originalText?: { text?: string };
      authorAttribution?: { displayName?: string; photoUri?: string; uri?: string };
      relativePublishTimeDescription?: string;
      publishTime?: string;
      googleMapsUri?: string;
    }>;
  };
  return normalizePlacesNewReviews(json.reviews ?? []);
}

async function getAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`OAuth token exchange failed: ${res.status}`);
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!json.access_token) throw new Error(json.error ?? "No access token returned");
  return json.access_token;
}

async function fetchBusinessProfileReviews(
  accessToken: string,
  accountId: string,
  locationId: string
): Promise<TestimonialReview[]> {
  const url = `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(
    accountId
  )}/locations/${encodeURIComponent(locationId)}/reviews`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`Business Profile API failed: ${res.status}`);
  const json = (await res.json()) as {
    reviews?: Array<{
      reviewer?: { displayName?: string; profilePhotoUrl?: string };
      starRating?: string;
      comment?: string;
      createTime?: string;
    }>;
  };
  return normalizeBusinessProfileReviews(json.reviews ?? []);
}

export async function GET() {
  const integrationLive = await isIntegrationEnabled("google_reviews");
  if (!integrationLive) {
    return ok({ reviews: [] });
  }

  try {
    const config = await loadConfig();
    const source: ReviewSource =
      config.source === "business_profile" ? "business_profile" : "places";

    if (source === "places") {
      const apiKey = config.api_key?.trim();
      const placeId = config.place_id?.trim();
      if (!apiKey || !placeId) {
        return ok({ reviews: [], source, error: "Missing API key or Place ID" });
      }
      const reviews = await fetchPlacesReviews(apiKey, placeId);
      return ok({ reviews, source });
    }

    const clientId = config.client_id?.trim();
    const clientSecret = config.client_secret?.trim();
    const refreshToken = config.refresh_token?.trim();
    const accountId = config.account_id?.trim();
    const locationId = config.location_id?.trim();
    if (!clientId || !clientSecret || !refreshToken || !accountId || !locationId) {
      return ok({ reviews: [], source, error: "Missing Business Profile credentials" });
    }

    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);
    const reviews = await fetchBusinessProfileReviews(accessToken, accountId, locationId);
    return ok({ reviews, source });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return ok({ reviews: [], error: message });
  }
}
