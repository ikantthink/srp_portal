import type { Profile } from "@/types/database";

interface Widget {
  id: string;
  type: string;
  config: Record<string, string>;
}

export function LinkCardPreview({
  profile,
  widgets,
}: {
  profile: Profile;
  widgets: Widget[];
}) {
  return (
    <div className="rounded-2xl border bg-card shadow-lg overflow-hidden max-w-sm mx-auto">
      <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-8 text-center text-white">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="mx-auto h-20 w-20 rounded-full border-4 border-white/30 object-cover"
          />
        ) : (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-2xl font-bold">
            {profile.full_name?.charAt(0) || "A"}
          </div>
        )}
        <h1 className="mt-4 text-xl font-bold">{profile.full_name}</h1>
        {profile.bio && <p className="mt-1 text-sm text-white/80">{profile.bio}</p>}
      </div>

      <div className="p-6 space-y-3">
        {widgets.map((widget) => (
          <WidgetPreview key={widget.id} widget={widget} />
        ))}
        {widgets.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Add widgets to see a preview
          </p>
        )}
      </div>
    </div>
  );
}

function WidgetPreview({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case "social_link":
      return (
        <a
          href={widget.config.url || "#"}
          className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
        >
          <span className="font-medium">{widget.config.platform || "Social"}</span>
        </a>
      );
    case "form_link":
      return (
        <a
          href={widget.config.url || "#"}
          className="flex items-center justify-center rounded-lg bg-brand-primary p-3 text-sm font-medium text-white hover:bg-brand-primary/90"
        >
          {widget.config.label || "Form"}
        </a>
      );
    case "text_block":
      return <p className="text-sm text-muted-foreground">{widget.config.text}</p>;
    case "contact_info":
      return (
        <div className="space-y-1 text-sm">
          {widget.config.phone && (
            <a href={`tel:${widget.config.phone}`} className="block text-brand-primary">
              {widget.config.phone}
            </a>
          )}
          {widget.config.email && (
            <a href={`mailto:${widget.config.email}`} className="block text-brand-primary">
              {widget.config.email}
            </a>
          )}
        </div>
      );
    case "newsletter_subscribe":
      return (
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-sm font-medium">{widget.config.heading || "Stay Updated"}</p>
          <p className="text-xs text-muted-foreground mt-1">{widget.config.description || ""}</p>
          <div className="mt-2 flex gap-1">
            <input
              type="email"
              placeholder="Email"
              className="flex-1 h-8 rounded border bg-background px-2 text-xs"
              disabled
            />
            <button className="h-8 rounded bg-brand-primary px-3 text-xs text-white" disabled>
              Subscribe
            </button>
          </div>
        </div>
      );
    case "image":
      return widget.config.url ? (
        <img src={widget.config.url} alt="" className="w-full rounded-lg" />
      ) : null;
    case "calendar_link":
      return (
        <a
          href={widget.config.url || "#"}
          className="flex items-center justify-center rounded-lg border p-3 text-sm font-medium hover:bg-muted"
        >
          Book an Appointment
        </a>
      );
    default:
      return (
        <div className="rounded-lg border p-3 text-xs text-muted-foreground capitalize">
          {widget.type.replace("_", " ")}
        </div>
      );
  }
}
