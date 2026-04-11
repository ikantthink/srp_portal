import type { ComponentConfig } from "@puckeditor/core";

export type NeighborhoodGuideProps = {
  name: string;
  description: string;
  image: string;
  stats: string;
};

export const NeighborhoodGuideConfig: ComponentConfig<NeighborhoodGuideProps> = {
  fields: {
    name: { type: "text" },
    description: { type: "textarea" },
    image: { type: "text" },
    stats: { type: "textarea" },
  },
  defaultProps: {
    name: "Downtown District",
    description: "A vibrant neighborhood with walkable streets, great restaurants, and proximity to parks.",
    image: "",
    stats: "Median Price|$350,000\nSchools|A-rated\nWalk Score|92",
  },
  render: ({ name, description, image, stats }) => {
    const statItems = stats
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [label, value] = line.split("|").map((s) => s?.trim());
        return { label, value };
      });

    return (
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2 items-center">
          <div>
            {image ? (
              <img src={image} alt={name} className="w-full rounded-xl object-cover aspect-video" />
            ) : (
              <div className="w-full rounded-xl bg-muted aspect-video flex items-center justify-center text-muted-foreground">
                Neighborhood Photo
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-muted-foreground">{description}</p>
            <div className="grid grid-cols-2 gap-3">
              {statItems.map((s, i) => (
                <div key={i} className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="font-semibold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  },
};
