import { describe, expect, it } from "vitest";
import {
  BUSINESS_PROFILE_DEFAULTS,
  businessJsonLd,
  serializeJsonLd,
  slugToPath,
} from "@/lib/seo/business-profile";

describe("slugToPath", () => {
  it("maps the home slug to /", () => {
    expect(slugToPath("home")).toBe("/");
  });

  it("maps a blog slug to /blog/", () => {
    expect(slugToPath("blog-x")).toBe("/blog/x");
  });

  it("maps other slugs to a top-level path", () => {
    expect(slugToPath("about")).toBe("/about");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < in business JSON-LD", () => {
    const html = serializeJsonLd(
      businessJsonLd(
        { ...BUSINESS_PROFILE_DEFAULTS, name: "SRP <script>" },
        null
      )
    );
    expect(html).not.toContain("<");
    expect(html).toContain("\\u003c");
  });
});
