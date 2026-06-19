import type { ComponentConfig } from "@puckeditor/core";

export type TestimonialsProps = {
  items: string;
};

export const TestimonialsConfig: ComponentConfig<TestimonialsProps> = {
  fields: {
    items: { type: "textarea" },
  },
  defaultProps: {
    items: "Jane D.|They made buying our first home so easy!|5\nJohn S.|Excellent service and communication throughout.|5",
  },
  render: ({ items }) => {
    const testimonials = items.split("\n").filter(Boolean).map((line) => {
      const [name, text, rating] = line.split("|");
      return { name: name?.trim(), text: text?.trim(), rating: Number(rating) || 5 };
    });

    return (
      <section className="px-4 py-12 bg-muted/30 sm:px-6 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 sm:text-3xl sm:mb-10">What Our Clients Say</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-3 text-brand-accent">
                  {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                </div>
                <p className="text-sm text-card-foreground mb-4">&ldquo;{t.text}&rdquo;</p>
                <p className="font-semibold text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  },
};
