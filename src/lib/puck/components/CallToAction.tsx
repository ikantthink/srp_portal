import type { ComponentConfig } from "@puckeditor/core";

export type CallToActionProps = {
  heading: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  variant: "primary" | "secondary" | "accent";
};

export const CallToActionConfig: ComponentConfig<CallToActionProps> = {
  fields: {
    heading: { type: "text" },
    description: { type: "textarea" },
    buttonText: { type: "text" },
    buttonLink: { type: "text" },
    variant: {
      type: "radio",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Accent", value: "accent" },
      ],
    },
  },
  defaultProps: {
    heading: "Ready to Get Started?",
    description: "Contact us today for a free consultation.",
    buttonText: "Contact Us",
    buttonLink: "/contact",
    variant: "primary",
  },
  render: ({ heading, description, buttonText, buttonLink, variant }) => {
    const bgMap = {
      primary: "bg-brand-primary text-white",
      secondary: "bg-brand-secondary text-white",
      accent: "bg-brand-accent text-black",
    };
    return (
      <section className={`px-6 py-16 ${bgMap[variant]}`}>
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold">{heading}</h2>
          <p className="text-lg opacity-90">{description}</p>
          <a
            href={buttonLink}
            className="inline-flex h-12 items-center rounded-lg bg-white/20 backdrop-blur px-8 font-semibold hover:bg-white/30 transition-colors"
          >
            {buttonText}
          </a>
        </div>
      </section>
    );
  },
};
