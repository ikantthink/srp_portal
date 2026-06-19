import type { Config, ComponentConfig } from "@puckeditor/core";
import { HeroConfig } from "./components/Hero";
import { TextBlockConfig } from "./components/TextBlock";
import { ImageGalleryConfig } from "./components/ImageGallery";
import { VideoEmbedConfig } from "./components/VideoEmbed";
import { TestimonialsConfig } from "./components/Testimonials";
import { CallToActionConfig } from "./components/CallToAction";
import { ContactInfoConfig } from "./components/ContactInfo";
import { TeamGridConfig } from "./components/TeamGrid";
import { ListingSearchConfig } from "./components/ListingSearch";
import { FeaturedListingsConfig } from "./components/FeaturedListings";
import { ListingsGridConfig } from "./components/ListingsGrid";
import { NeighborhoodGuideConfig } from "./components/NeighborhoodGuide";
import { BlogFeedConfig } from "./components/BlogFeed";
import { StatsConfig } from "./components/Stats";
import { FAQConfig } from "./components/FAQ";
import { SpacerConfig } from "./components/Spacer";
import { DividerConfig } from "./components/Divider";
import { FormEmbedConfig } from "./components/FormEmbed";
import { NewsletterSubscribeConfig } from "./components/NewsletterSubscribe";
import { HeroVideoConfig } from "./components/HeroVideo";
import { HeroFlexConfig } from "./components/HeroFlex";
import { YouTubeFeedConfig } from "./components/YouTubeFeed";
import { RowConfig } from "./components/Row";
import { ColumnConfig } from "./components/Column";
import { TileConfig } from "./components/Tile";
import { ImageConfig } from "./components/Image";
import { withLayoutFields } from "./fields/layout-fields";

// Note: MainNav and Footer were per-page Puck blocks but now live as global
// site chrome (see /portal/website/chrome). They are intentionally not in
// `baseComponents`; the renderer filters them out of `data.content` so older
// pages that still embed them render without crashing.

// Helper that wraps the heterogeneous block configs while preserving their
// individual prop shapes. Spacer/Divider opt out of layout fields because
// they *are* layout primitives — wrapping them would just double-stack
// spacing. Column/Tile opt out because their *outer* element has to carry
// width / flex-item / background-image responsibilities directly — adding
// the layout wrapper would put padding/margin on the wrong node and break
// the grid math (Column) or push the bg-image away from the card edges
// (Tile). Same reasoning as HeroFlex. The `any` here is necessary because
// Puck's `ComponentConfig` generic cannot be satisfied with a single
// constraint across blocks with heterogeneous prop shapes; see
// layout-fields.tsx for context.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wrap = (c: ComponentConfig<any>) => withLayoutFields(c);

const baseComponents: Record<string, any> = {
  Hero: wrap(HeroConfig),
  HeroVideo: wrap(HeroVideoConfig),
  // HeroFlex owns its own padding/height/maxWidth controls so that those
  // settings stay INSIDE the section (otherwise the layout-fields wrapper
  // would push the hero's background away from the page edges with
  // surrounding margin/padding). Same opt-out reasoning as Spacer/Divider.
  HeroFlex: HeroFlexConfig,
  TextBlock: wrap(TextBlockConfig),
  Image: wrap(ImageConfig),
  ImageGallery: wrap(ImageGalleryConfig),
  VideoEmbed: wrap(VideoEmbedConfig),
  YouTubeFeed: wrap(YouTubeFeedConfig),
  Testimonials: wrap(TestimonialsConfig),
  CallToAction: wrap(CallToActionConfig),
  ContactInfo: wrap(ContactInfoConfig),
  TeamGrid: wrap(TeamGridConfig),
  ListingSearch: wrap(ListingSearchConfig),
  FeaturedListings: wrap(FeaturedListingsConfig),
  ListingsGrid: wrap(ListingsGridConfig),
  NeighborhoodGuide: wrap(NeighborhoodGuideConfig),
  BlogFeed: wrap(BlogFeedConfig),
  Stats: wrap(StatsConfig),
  FAQ: wrap(FAQConfig),
  Spacer: SpacerConfig,
  Divider: DividerConfig,
  Row: wrap(RowConfig),
  // Column owns its own width/padding/margin/background so its outer element
  // is the flex item the parent Row positions. Tile owns inner padding so
  // the bg-image stays edge-to-edge inside the card. See HeroFlex.tsx for
  // the same opt-out rationale.
  Column: ColumnConfig,
  Tile: TileConfig,
  FormEmbed: wrap(FormEmbedConfig),
  NewsletterSubscribe: wrap(NewsletterSubscribeConfig),
};

export const puckConfig: Config = {
  components: baseComponents,
  categories: {
    Content: {
      components: ["Hero", "HeroVideo", "HeroFlex", "TextBlock", "Tile", "Image", "ImageGallery", "VideoEmbed", "YouTubeFeed", "Testimonials", "Stats", "FAQ"],
      title: "Content",
      defaultExpanded: true,
    },
    Actions: {
      components: ["CallToAction", "ContactInfo", "TeamGrid"],
      title: "Actions",
    },
    Listings: {
      components: ["ListingSearch", "FeaturedListings", "ListingsGrid", "NeighborhoodGuide", "BlogFeed"],
      title: "Listings & Data",
    },
    Forms: {
      components: ["FormEmbed", "NewsletterSubscribe"],
      title: "Forms",
    },
    Layout: {
      components: ["Row", "Column", "Spacer", "Divider"],
      title: "Layout",
    },
  },
};

export const componentNames = Object.keys(baseComponents);

export interface BlockPresetData {
  id: string;
  name: string;
  component_type: string;
  folder: string;
  props: Record<string, unknown>;
}

export function buildConfigWithPresets(
  presets: BlockPresetData[],
  overrides?: { formSlug?: string }
): Config {
  const components = { ...baseComponents };
  const categories: Record<string, { components: string[]; title: string; defaultExpanded?: boolean }> = {
    ...((puckConfig.categories as any) || {}),
  };

  if (overrides?.formSlug && components.FormEmbed) {
    components.FormEmbed = {
      ...components.FormEmbed,
      defaultProps: {
        ...components.FormEmbed.defaultProps,
        formSlug: overrides.formSlug,
      },
    };
  }

  const presetFolders = new Map<string, string[]>();

  for (const preset of presets) {
    const baseConfig = baseComponents[preset.component_type];
    if (!baseConfig) continue;

    const presetKey = `${preset.component_type}__${preset.id.slice(0, 8)}`;

    components[presetKey] = {
      ...baseConfig,
      label: preset.name,
      defaultProps: {
        ...baseConfig.defaultProps,
        ...preset.props,
      },
    };

    if (!presetFolders.has(preset.folder)) {
      presetFolders.set(preset.folder, []);
    }
    presetFolders.get(preset.folder)!.push(presetKey);
  }

  for (const [folder, presetComponents] of presetFolders) {
    categories[`preset_${folder}`] = {
      components: presetComponents,
      title: folder,
    };
  }

  return { components, categories } as Config;
}
