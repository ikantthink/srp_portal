import { describe, it, expect } from "vitest";
import { puckConfig, componentNames } from "@/lib/puck/config";

describe("Puck Config", () => {
  // MainNav and Footer used to ship as in-page Puck blocks, but they now live
  // as global site chrome edited from /portal/website/chrome — they should
  // not appear in the Puck drawer anymore.
  const expectedComponents = [
    "Hero",
    "HeroVideo",
    "HeroFlex",
    "TextBlock",
    "Image",
    "ImageGallery",
    "VideoEmbed",
    "YouTubeFeed",
    "Testimonials",
    "CallToAction",
    "ContactInfo",
    "TeamGrid",
    "ListingSearch",
    "FeaturedListings",
    "ListingsGrid",
    "NeighborhoodGuide",
    "BlogFeed",
    "Stats",
    "FAQ",
    "Spacer",
    "Divider",
    "Row",
    "Column",
    "Tile",
    "FormEmbed",
    "NewsletterSubscribe",
  ];

  it("registers all planned components", () => {
    expect(Object.keys(puckConfig.components)).toHaveLength(expectedComponents.length);
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
