import type { ComponentConfig } from "@puckeditor/core";

export type BlogFeedProps = {
  heading: string;
  count: number;
};

export const BlogFeedConfig: ComponentConfig<BlogFeedProps> = {
  fields: {
    heading: { type: "text" },
    count: { type: "number" },
  },
  defaultProps: {
    heading: "Latest From Our Blog",
    count: 3,
  },
  render: ({ heading, count, puck }) => (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 sm:text-3xl sm:mb-10">{heading}</h2>
        {puck?.isEditing ? (
          <div className="rounded-lg border-2 border-dashed border-brand-primary/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Blog feed ({count} recent posts) — posts managed via Website CMS
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <article key={i} className="rounded-xl border overflow-hidden">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">April 2026</p>
                  <h3 className="font-semibold">Blog Post Title</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    A brief preview of the blog post content goes here.
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  ),
};
