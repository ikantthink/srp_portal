import type { ComponentConfig } from "@puckeditor/core";
import { mediaUrlField } from "../fields/media-url-field";

export type HeroProps = {
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage: string;
  overlay: boolean;
};

export const HeroConfig: ComponentConfig<HeroProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    ctaText: { type: "text" },
    ctaLink: { type: "text" },
    backgroundImage: mediaUrlField({ accept: "image", folderSlug: "website" }),
    overlay: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
  },
  defaultProps: {
    heading: "Find Your Dream Home",
    subheading: "We help you navigate the real estate market with confidence.",
    ctaText: "Get Started",
    ctaLink: "/contact",
    backgroundImage: "",
    overlay: true,
  },
  render: ({ heading, subheading, ctaText, ctaLink, backgroundImage, overlay }) => (
    <section
      className="relative flex min-h-[380px] items-center justify-center px-4 py-16 text-center sm:min-h-[500px] sm:px-6 sm:py-24"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))" }}
    >
      {overlay && <div className="absolute inset-0 bg-black/50" />}
      <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          {heading}
        </h1>
        <p className="text-base text-white/90 sm:text-lg md:text-xl">{subheading}</p>
        {ctaText && (
          <a
            href={ctaLink}
            className="inline-flex h-11 items-center rounded-lg bg-brand-accent px-6 font-semibold text-black transition-opacity hover:opacity-90 sm:h-12 sm:px-8"
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  ),
};
