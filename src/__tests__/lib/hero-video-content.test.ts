import { describe, it, expect } from "vitest";
import {
  heroVideoLegacyHtml,
  heroVideoContentHtml,
} from "@/lib/puck/components/hero-video-content";

describe("hero-video-content", () => {
  it("builds HTML from all legacy fields", () => {
    expect(
      heroVideoLegacyHtml({
        heading: "Welcome Home",
        subheading: "Find your place.",
        ctaText: "Get Started",
        ctaLink: "/contact",
      }),
    ).toBe(
      '<h1>Welcome Home</h1><p>Find your place.</p><p><a href="/contact">Get Started</a></p>',
    );
  });

  it("omits empty legacy fields and defaults a missing CTA link to #", () => {
    expect(heroVideoLegacyHtml({ heading: "Only Heading" })).toBe("<h1>Only Heading</h1>");
    expect(heroVideoLegacyHtml({ ctaText: "Go" })).toBe('<p><a href="#">Go</a></p>');
    expect(heroVideoLegacyHtml({})).toBe("");
  });

  it("escapes HTML in legacy values", () => {
    expect(heroVideoLegacyHtml({ heading: '<script>"x"' })).toBe(
      "<h1>&lt;script&gt;&quot;x&quot;</h1>",
    );
  });

  it("prefers content over legacy fields when content is set", () => {
    expect(
      heroVideoContentHtml({ content: "<h2>New</h2>", heading: "Old" }),
    ).toBe("<h2>New</h2>");
  });

  it("falls back to legacy migration when content is blank", () => {
    expect(heroVideoContentHtml({ content: "   ", heading: "Old" })).toBe("<h1>Old</h1>");
  });
});
