import { describe, it, expect } from "vitest";
import {
  mergeReviews,
  normalizePlacesNewReviews,
  normalizePlacesReviews,
  parseManualItems,
} from "@/lib/testimonials/reviews";

describe("testimonial reviews helpers", () => {
  it("parses manual pipe-delimited items", () => {
    const items = "Jane D.|Great service!|5\nJohn S.|Solid work.|4";
    expect(parseManualItems(items)).toEqual([
      { name: "Jane D.", text: "Great service!", rating: 5, source: "manual" },
      { name: "John S.", text: "Solid work.", rating: 4, source: "manual" },
    ]);
  });

  it("normalizes Places API reviews", () => {
    const reviews = normalizePlacesReviews([
      {
        author_name: "Alice",
        text: "Loved it",
        rating: 5,
        profile_photo_url: "https://example.com/a.jpg",
        relative_time_description: "2 weeks ago",
      },
    ]);
    expect(reviews[0]).toMatchObject({
      name: "Alice",
      text: "Loved it",
      rating: 5,
      profilePhoto: "https://example.com/a.jpg",
      time: "2 weeks ago",
      source: "google",
    });
  });

  it("normalizes Places API (New) reviews", () => {
    const reviews = normalizePlacesNewReviews([
      {
        rating: 5,
        text: { text: "Loved it" },
        authorAttribution: {
          displayName: "Alice",
          photoUri: "https://example.com/a.jpg",
        },
        relativePublishTimeDescription: "2 weeks ago",
        googleMapsUri: "https://maps.google.com/review/123",
      },
    ]);
    expect(reviews[0]).toMatchObject({
      name: "Alice",
      text: "Loved it",
      rating: 5,
      profilePhoto: "https://example.com/a.jpg",
      time: "2 weeks ago",
      reviewUrl: "https://maps.google.com/review/123",
      source: "google",
    });
  });

  it("parses optional manual review link as a 4th field", () => {
    const [item] = parseManualItems("Jane|Great|5|https://example.com/r");
    expect(item.reviewUrl).toBe("https://example.com/r");
  });

  it("merge mode caps and orders manual before google with minRating filter", () => {
    const manual = parseManualItems("A.|One|5\nB.|Two|5");
    const google = normalizePlacesReviews([
      { author_name: "G1", text: "Google one", rating: 5 },
      { author_name: "G2", text: "Google two", rating: 2 },
    ]);
    const merged = mergeReviews(manual, google, 3, 4);
    expect(merged).toHaveLength(3);
    expect(merged.map((r) => r.name)).toEqual(["A.", "B.", "G1"]);
    expect(merged.every((r) => r.rating >= 4)).toBe(true);
  });
});
