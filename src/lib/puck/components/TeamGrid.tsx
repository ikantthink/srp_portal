import type { ComponentConfig } from "@puckeditor/core";

export type TeamGridProps = {
  heading: string;
  members: string;
};

export const TeamGridConfig: ComponentConfig<TeamGridProps> = {
  fields: {
    heading: { type: "text" },
    members: { type: "textarea" },
  },
  defaultProps: {
    heading: "Meet Our Team",
    members:
      "Jane Smith|Lead Agent|jane@srpre.com|https://placehold.co/200\nJohn Doe|Buyer Specialist|john@srpre.com|https://placehold.co/200",
  },
  render: ({ heading, members }) => {
    const team = members
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [name, role, email, avatar] = line.split("|").map((s) => s?.trim());
        return { name, role, email, avatar };
      });

    return (
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">{heading}</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m, i) => (
              <div key={i} className="rounded-xl border bg-card p-6 text-center">
                {m.avatar && (
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="mx-auto mb-4 h-24 w-24 rounded-full object-cover"
                  />
                )}
                <h3 className="font-semibold">{m.name}</h3>
                <p className="text-sm text-muted-foreground">{m.role}</p>
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    className="mt-2 inline-block text-sm text-brand-primary hover:underline"
                  >
                    {m.email}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  },
};
