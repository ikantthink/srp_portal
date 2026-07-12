export type TestimonialReview = {
  name: string;
  text: string;
  rating: number;
  profilePhoto?: string;
  time?: string;
  reviewUrl?: string;
  source: "manual" | "google";
};

export function parseManualItems(items: string): TestimonialReview[] {
  return items
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, text, rating, url] = line.split("|");
      return {
        name: name?.trim() ?? "",
        text: text?.trim() ?? "",
        rating: Number(rating) || 5,
        reviewUrl: url?.trim() || undefined,
        source: "manual" as const,
      };
    });
}

export function normalizePlacesReviews(
  reviews: Array<{
    author_name?: string;
    profile_photo_url?: string;
    rating?: number;
    text?: string;
    relative_time_description?: string;
    time?: number;
  }>
): TestimonialReview[] {
  return reviews.map((r) => ({
    name: r.author_name?.trim() ?? "Google User",
    text: r.text?.trim() ?? "",
    rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
    profilePhoto: r.profile_photo_url,
    time: r.relative_time_description ?? (r.time ? new Date(r.time * 1000).toISOString() : undefined),
    source: "google" as const,
  }));
}

// Places API (New) — GET https://places.googleapis.com/v1/places/{id}. Reviews
// use a nested shape distinct from the legacy Place Details endpoint.
export function normalizePlacesNewReviews(
  reviews: Array<{
    rating?: number;
    text?: { text?: string };
    originalText?: { text?: string };
    authorAttribution?: { displayName?: string; photoUri?: string; uri?: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
    googleMapsUri?: string;
  }>
): TestimonialReview[] {
  return reviews.map((r) => ({
    name: r.authorAttribution?.displayName?.trim() ?? "Google User",
    text: (r.text?.text ?? r.originalText?.text ?? "").trim(),
    rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
    profilePhoto: r.authorAttribution?.photoUri,
    time: r.relativePublishTimeDescription ?? r.publishTime,
    // Deep-link to the review on Google Maps; fall back to the author's profile.
    reviewUrl: r.googleMapsUri ?? r.authorAttribution?.uri,
    source: "google" as const,
  }));
}

const STAR_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export function normalizeBusinessProfileReviews(
  reviews: Array<{
    reviewer?: { displayName?: string; profilePhotoUrl?: string };
    starRating?: string;
    comment?: string;
    createTime?: string;
  }>
): TestimonialReview[] {
  return reviews.map((r) => ({
    name: r.reviewer?.displayName?.trim() ?? "Google User",
    text: r.comment?.trim() ?? "",
    rating: STAR_MAP[r.starRating ?? "FIVE"] ?? 5,
    profilePhoto: r.reviewer?.profilePhotoUrl,
    time: r.createTime,
    source: "google" as const,
  }));
}

export function filterByMinRating(reviews: TestimonialReview[], minRating: number): TestimonialReview[] {
  if (minRating <= 1) return reviews;
  return reviews.filter((r) => r.rating >= minRating);
}

export function mergeReviews(
  manual: TestimonialReview[],
  google: TestimonialReview[],
  maxReviews: number,
  minRating = 1
): TestimonialReview[] {
  const filtered = filterByMinRating([...manual, ...google], minRating);
  return filtered.slice(0, Math.max(1, maxReviews));
}
