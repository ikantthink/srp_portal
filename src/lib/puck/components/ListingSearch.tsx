import type { ComponentConfig } from "@puckeditor/core";

export type ListingSearchProps = {
  heading: string;
  placeholder: string;
};

export const ListingSearchConfig: ComponentConfig<ListingSearchProps> = {
  fields: {
    heading: { type: "text" },
    placeholder: { type: "text" },
  },
  defaultProps: {
    heading: "Search Properties",
    placeholder: "City, ZIP, or address...",
  },
  render: ({ heading, placeholder, puck }) => (
    <section className="px-6 py-12 bg-muted/30">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-bold">{heading}</h2>
        {puck?.isEditing ? (
          <div className="rounded-lg border-2 border-dashed border-brand-primary/30 p-8">
            <p className="text-sm text-muted-foreground">
              IDX/RESO search widget — configure your provider in Super Admin
            </p>
          </div>
        ) : (
          <form action="/listings" method="GET" className="flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              name="q"
              placeholder={placeholder}
              className="flex-1 h-12 rounded-lg border border-border bg-background px-4 text-sm"
            />
            <button
              type="submit"
              className="h-12 rounded-lg bg-brand-primary px-6 text-sm font-medium text-white hover:bg-brand-primary/90"
            >
              Search
            </button>
          </form>
        )}
      </div>
    </section>
  ),
};
