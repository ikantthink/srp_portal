import type { Config } from "@puckeditor/core";
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
import { NeighborhoodGuideConfig } from "./components/NeighborhoodGuide";
import { BlogFeedConfig } from "./components/BlogFeed";
import { StatsConfig } from "./components/Stats";
import { FAQConfig } from "./components/FAQ";
import { SpacerConfig } from "./components/Spacer";
import { DividerConfig } from "./components/Divider";
import { FormEmbedConfig } from "./components/FormEmbed";
import { NewsletterSubscribeConfig } from "./components/NewsletterSubscribe";

const baseComponents: Record<string, any> = {
  Hero: HeroConfig,
  TextBlock: TextBlockConfig,
  ImageGallery: ImageGalleryConfig,
  VideoEmbed: VideoEmbedConfig,
  Testimonials: TestimonialsConfig,
  CallToAction: CallToActionConfig,
  ContactInfo: ContactInfoConfig,
  TeamGrid: TeamGridConfig,
  ListingSearch: ListingSearchConfig,
  FeaturedListings: FeaturedListingsConfig,
  NeighborhoodGuide: NeighborhoodGuideConfig,
  BlogFeed: BlogFeedConfig,
  Stats: StatsConfig,
  FAQ: FAQConfig,
  Spacer: SpacerConfig,
  Divider: DividerConfig,
  FormEmbed: FormEmbedConfig,
  NewsletterSubscribe: NewsletterSubscribeConfig,
};

export const puckConfig: Config = {
  components: baseComponents,
  categories: {
    Content: {
      components: ["Hero", "TextBlock", "ImageGallery", "VideoEmbed", "Testimonials", "Stats", "FAQ"],
      title: "Content",
      defaultExpanded: true,
    },
    Actions: {
      components: ["CallToAction", "ContactInfo", "TeamGrid"],
      title: "Actions",
    },
    Listings: {
      components: ["ListingSearch", "FeaturedListings", "NeighborhoodGuide", "BlogFeed"],
      title: "Listings & Data",
    },
    Forms: {
      components: ["FormEmbed", "NewsletterSubscribe"],
      title: "Forms",
    },
    Layout: {
      components: ["Spacer", "Divider"],
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
