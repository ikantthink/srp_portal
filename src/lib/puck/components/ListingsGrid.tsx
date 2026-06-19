import type { ComponentConfig } from "@puckeditor/core";

// Listings Grid is the "browse all properties" block — historically the body
// of the hardcoded /listings route. The render here is the placeholder grid
// that ships before an IDX/RESO provider is wired up; once `listings_api` is
// enabled the renderer keeps this block intact (vs. FeaturedListings/
// ListingSearch, which only have a teaser role on other pages).
//
// IMPORTANT: ListingsGrid IS listed in `LISTINGS_COMPONENTS` in renderer.tsx
// so it falls back to the "Listings provider not configured" placeholder
// when the integration is off. That matches the user-facing message we want
// on the public /listings page when there's nothing to show.

export type ListingsGridProps = {
  heading: string;
  description: string;
  count: number;
  columns: "2" | "3" | "4";
};

const COLUMNS_CLASS: Record<ListingsGridProps["columns"], string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 lg:grid-cols-3",
  "4": "sm:grid-cols-2 lg:grid-cols-4",
};

export const ListingsGridConfig: ComponentConfig<ListingsGridProps> = {
  fields: {
    heading: { type: "text" },
    description: { type: "textarea" },
    count: { type: "number", min: 1, max: 24 },
    columns: {
      type: "select",
      options: [
        { label: "2 columns", value: "2" },
        { label: "3 columns", value: "3" },
        { label: "4 columns", value: "4" },
      ],
    },
  },
  defaultProps: {
    heading: "Property Listings",
    description:
      "Property search powered by IDX / RESO API. Configure your listing provider in Super Admin settings to enable live MLS data.",
    count: 6,
    columns: "3",
  },
  render: ({ heading, description, count, columns, puck }) => {
    const safeCount = Math.max(1, Math.min(24, Math.floor(count) || 6));
    const gridCols = COLUMNS_CLASS[columns] ?? COLUMNS_CLASS["3"];

    return (
      <section className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-8">
          {(heading || description) && (
            <header className="space-y-3">
              {heading && (
                <h1 className="text-3xl font-bold sm:text-4xl">{heading}</h1>
              )}
              {description && (
                <p className="max-w-3xl text-muted-foreground">{description}</p>
              )}
            </header>
          )}

          {puck?.isEditing ? (
            <div className="rounded-lg border-2 border-dashed border-brand-primary/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Listings grid ({safeCount} {columns}-col cards) &mdash; powered by
                IDX/RESO
              </p>
            </div>
          ) : (
            <div className={`grid gap-6 ${gridCols}`}>
              {Array.from({ length: safeCount }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border">
                  <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
                    Listing Photo
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="font-semibold">$425,000</p>
                    <p className="text-sm text-muted-foreground">
                      123 Example St, City, ST 12345
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
    );
  },
};
