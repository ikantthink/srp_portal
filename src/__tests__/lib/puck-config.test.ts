import { describe, it, expect } from "vitest";
import { puckConfig, componentNames } from "@/lib/puck/config";

describe("Puck Config", () => {
  const expectedComponents = [
    "Hero",
    "TextBlock",
    "ImageGallery",
    "VideoEmbed",
    "Testimonials",
    "CallToAction",
    "ContactInfo",
    "TeamGrid",
    "ListingSearch",
    "FeaturedListings",
    "NeighborhoodGuide",
    "BlogFeed",
    "Stats",
    "FAQ",
    "Spacer",
    "Divider",
    "FormEmbed",
    "NewsletterSubscribe",
  ];

  it("registers all 18 planned components", () => {
    expect(Object.keys(puckConfig.components)).toHaveLength(18);
  });

  it.each(expectedComponents)("has %s component registered", (name) => {
    expect(puckConfig.components).toHaveProperty(name);
  });

  it("exports componentNames matching the config keys", () => {
    expect(componentNames).toEqual(Object.keys(puckConfig.components));
  });

  it("each component has a render function", () => {
    for (const [name, config] of Object.entries(puckConfig.components)) {
      expect(config, `${name} missing render`).toHaveProperty("render");
      expect(typeof (config as any).render).toBe("function");
    }
  });

  it("each component has defaultProps", () => {
    for (const [name, config] of Object.entries(puckConfig.components)) {
      expect(config, `${name} missing defaultProps`).toHaveProperty("defaultProps");
    }
  });

  it("each component has fields definition", () => {
    for (const [name, config] of Object.entries(puckConfig.components)) {
      expect(config, `${name} missing fields`).toHaveProperty("fields");
      expect(typeof (config as any).fields).toBe("object");
    }
  });
});
