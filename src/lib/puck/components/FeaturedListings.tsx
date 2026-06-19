import type { ComponentConfig } from "@puckeditor/core";

export type FeaturedListingsProps = {
  heading: string;
  count: number;
};

export const FeaturedListingsConfig: ComponentConfig<FeaturedListingsProps> = {
  fields: {
    heading: { type: "text" },
    count: { type: "number" },
  },
  defaultProps: {
    heading: "Featured Properties",
    count: 3,
  },
  render: ({ heading, count, puck }) => (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 sm:text-3xl sm:mb-10">{heading}</h2>
        {puck?.isEditing ? (
          <div className="rounded-lg border-2 border-dashed border-brand-primary/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Featured Listings carousel ({count} items) — powered by IDX/RESO
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="rounded-xl border overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  Listing Photo
                </div>
                <div className="p-4 space-y-1">
                  <p className="font-semibold">$425,000</p>
                  <p className="text-sm text-muted-foreground">
                    123 Example St, City, ST
                  </p>
                  <p className="text-xs text-muted-foreground">
                    3 bed &middot; 2 bath &middot; 1,800 sqft
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  ),
};
