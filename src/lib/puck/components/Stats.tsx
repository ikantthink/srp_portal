import type { ComponentConfig } from "@puckeditor/core";

export type StatsProps = {
  items: string;
};

export const StatsConfig: ComponentConfig<StatsProps> = {
  fields: {
    items: { type: "textarea" },
  },
  defaultProps: {
    items: "500+|Homes Sold\n98%|Client Satisfaction\n15+|Years Experience\n$200M+|In Sales Volume",
  },
  render: ({ items }) => {
    const stats = items.split("\n").filter(Boolean).map((line) => {
      const [value, label] = line.split("|");
      return { value: value?.trim(), label: label?.trim() };
    });

    return (
      <section className="px-4 py-12 bg-muted/30 sm:px-6 sm:py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold text-brand-primary sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    );
  },
};
