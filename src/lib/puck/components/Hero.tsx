import type { ComponentConfig } from "@puckeditor/core";

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
    backgroundImage: { type: "text" },
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
      className="relative flex min-h-[500px] items-center justify-center px-6 py-24 text-center"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))" }}
    >
      {overlay && <div className="absolute inset-0 bg-black/50" />}
      <div className="relative z-10 max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          {heading}
        </h1>
        <p className="text-lg text-white/90 sm:text-xl">{subheading}</p>
        {ctaText && (
          <a
            href={ctaLink}
            className="inline-flex h-12 items-center rounded-lg bg-brand-accent px-8 font-semibold text-black transition-opacity hover:opacity-90"
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  ),
};
