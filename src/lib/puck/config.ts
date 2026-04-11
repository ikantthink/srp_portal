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

export const puckConfig: Config = {
  components: {
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
  },
};

export const componentNames = Object.keys(puckConfig.components);
