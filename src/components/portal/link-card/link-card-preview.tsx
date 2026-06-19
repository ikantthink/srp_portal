"use client";

import type { Profile, LinkCardLayout } from "@/types/database";
import { Phone, Mail } from "lucide-react";
import { getPlatformIcon } from "@/lib/social/platform-icons";

// ─── Types ───────────────────────────────────────────────────

interface Widget {
  id: string;
  type: string;
  config: Record<string, string>;
  children?: Widget[];
}

const DEFAULT_LAYOUT: LinkCardLayout = {
  show_header: true,
  show_name: true,
  show_bio: true,
  show_avatar: true,
  header_bg_type: "gradient",
  header_gradient_from: "",
  header_gradient_to: "",
  header_bg_image: "",
  header_text_color: "#ffffff",
  avatar_size: "md",
  page_bg_color: "",
  card_bg_color: "",
  body_text_color: "",
};

// ─── Avatar sizes ────────────────────────────────────────────

const AVATAR_SIZES: Record<string, string> = {
  sm: "h-14 w-14",
  md: "h-20 w-20",
  lg: "h-28 w-28",
  xl: "h-36 w-36",
};

// ─── Border radius map ──────────────────────────────────────

const RADIUS_MAP: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

// ─── Main component ──────────────────────────────────────────

export function LinkCardPreview({
  profile,
  widgets,
  layout: layoutProp,
}: {
  profile: Profile;
  widgets: Widget[];
  layout?: LinkCardLayout | Record<string, unknown>;
}) {
  const layout: LinkCardLayout = { ...DEFAULT_LAYOUT, ...(layoutProp || {}) } as LinkCardLayout;

  const headerBgStyle: React.CSSProperties =
    layout.header_bg_type === "image" && layout.header_bg_image
      ? {
          backgroundImage: `url(${layout.header_bg_image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : layout.header_gradient_from && layout.header_gradient_to
        ? {
            background: `linear-gradient(135deg, ${layout.header_gradient_from}, ${layout.header_gradient_to})`,
          }
        : {};

  const avatarSize = AVATAR_SIZES[layout.avatar_size] || AVATAR_SIZES.md;

  const pageBg = layout.page_bg_color || undefined;
  const cardBg = layout.card_bg_color || undefined;
  const bodyColor = layout.body_text_color || undefined;

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: pageBg }}>
      <div
        className="rounded-2xl border bg-card shadow-lg overflow-hidden max-w-sm mx-auto"
        style={{ backgroundColor: cardBg, color: bodyColor }}
      >
        {layout.show_header && (
          <div
            className="bg-gradient-to-br from-brand-primary to-brand-secondary p-8 text-center"
            style={{
              ...headerBgStyle,
              color: layout.header_text_color || "#ffffff",
            }}
          >
            {layout.show_avatar &&
              (profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className={`mx-auto ${avatarSize} rounded-full border-4 border-white/30 object-cover`}
                />
              ) : (
                <div
                  className={`mx-auto flex ${avatarSize} items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-2xl font-bold`}
                >
                  {profile.full_name?.charAt(0) || "A"}
                </div>
              ))}
            {layout.show_name && (
              <h1 className="mt-4 text-xl font-bold">{profile.full_name}</h1>
            )}
            {layout.show_bio && profile.bio && (
              <p className="mt-1 text-sm opacity-80">{profile.bio}</p>
            )}
          </div>
        )}

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
    </div>
  );
}

// ─── Widget renderer ─────────────────────────────────────────

function WidgetPreview({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case "social_link":
      return <SocialLinkPreview widget={widget} />;
    case "button_link":
      return <ButtonLinkPreview widget={widget} />;
    case "form_link":
      return <FormLinkPreview widget={widget} />;
    case "text_block":
      return <p className="text-sm text-muted-foreground">{widget.config.text}</p>;
    case "contact_info":
      return (
        <div className="space-y-1 text-sm">
          {widget.config.phone && (
            <a href={`tel:${widget.config.phone}`} className="flex items-center gap-2 text-brand-primary">
              <Phone className="h-3.5 w-3.5" />
              {widget.config.phone}
            </a>
          )}
          {widget.config.email && (
            <a href={`mailto:${widget.config.email}`} className="flex items-center gap-2 text-brand-primary">
              <Mail className="h-3.5 w-3.5" />
              {widget.config.email}
            </a>
          )}
        </div>
      );
    case "newsletter_subscribe":
      return (
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-sm font-medium">
            {widget.config.heading || "Stay Updated"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {widget.config.description || ""}
          </p>
          <div className="mt-2 flex gap-1">
            <input
              type="email"
              placeholder="Email"
              className="flex-1 h-8 rounded border bg-background px-2 text-xs"
              disabled
            />
            <button
              className="h-8 rounded bg-brand-primary px-3 text-xs text-white"
              disabled
            >
              Subscribe
            </button>
          </div>
        </div>
      );
    case "image":
      return <ImagePreview widget={widget} />;
    case "calendar_link": {
      const calNewTab = widget.config.open_new_tab === "true";
      return (
        <a
          href={widget.config.url || "#"}
          target={calNewTab ? "_blank" : undefined}
          rel={calNewTab ? "noopener noreferrer" : undefined}
          className="flex items-center justify-center rounded-lg border p-3 text-sm font-medium hover:bg-muted"
        >
          Book an Appointment
        </a>
      );
    }
    case "widget_group":
      return <WidgetGroupPreview widget={widget} />;
    case "video_embed":
      return widget.config.url ? (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <iframe
            src={toEmbedUrl(widget.config.url)}
            className="h-full w-full"
            allowFullScreen
            title="Video"
          />
        </div>
      ) : (
        <div className="rounded-lg border p-3 text-xs text-muted-foreground">
          Video Embed
        </div>
      );
    case "map_embed":
      return widget.config.address ? (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(widget.config.address)}&output=embed`}
            className="h-full w-full"
            title="Map"
          />
        </div>
      ) : (
        <div className="rounded-lg border p-3 text-xs text-muted-foreground">
          Map Embed
        </div>
      );
    default:
      return (
        <div className="rounded-lg border p-3 text-xs text-muted-foreground capitalize">
          {widget.type.replace(/_/g, " ")}
        </div>
      );
  }
}

// ─── Social link ─────────────────────────────────────────────

function SocialLinkPreview({ widget }: { widget: Widget }) {
  const { config } = widget;
  const Icon = getPlatformIcon(config.platform || "");
  const isIcon = config.display_as_icon === "true";
  const bgColor = config.bg_color || undefined;
  const textColor = config.text_color || undefined;
  const hoverBgColor = config.hover_color || undefined;
  const hoverTextColor = config.hover_text_color || undefined;
  const rounded = config.rounded !== "false";
  const newTab = config.open_new_tab !== "false";

  function onEnter(e: React.MouseEvent) {
    const el = e.currentTarget as HTMLElement;
    if (hoverBgColor) el.style.backgroundColor = hoverBgColor;
    if (hoverTextColor) el.style.color = hoverTextColor;
  }

  function onLeave(e: React.MouseEvent) {
    const el = e.currentTarget as HTMLElement;
    el.style.backgroundColor = bgColor || "";
    el.style.color = textColor || "";
  }

  if (isIcon) {
    return (
      <a
        href={config.url || "#"}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        className={`inline-flex items-center justify-center h-10 w-10 transition-all duration-200 hover:scale-110 ${rounded ? "rounded-full" : "rounded-lg"}`}
        style={{ backgroundColor: bgColor, color: textColor }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        title={config.platform || "Social"}
      >
        <Icon className="h-5 w-5" />
      </a>
    );
  }

  return (
    <a
      href={config.url || "#"}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={`flex items-center gap-3 ${rounded ? "rounded-full" : "rounded-lg"} border p-3 text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}
      style={{ backgroundColor: bgColor, color: textColor }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{config.platform || "Social"}</span>
    </a>
  );
}

// ─── Button link ─────────────────────────────────────────────

function ButtonLinkPreview({ widget }: { widget: Widget }) {
  const { config } = widget;
  const radius = RADIUS_MAP[config.border_radius || "lg"] || "rounded-lg";
  const newTab = config.open_new_tab === "true";
  const hasBgColor = config.bg_color && config.bg_color !== "";

  return (
    <a
      href={config.url || "#"}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={`flex items-center justify-center ${radius} p-3 text-sm font-medium transition-opacity hover:opacity-90 ${!hasBgColor ? "bg-brand-primary" : ""}`}
      style={{
        backgroundColor: hasBgColor ? config.bg_color : undefined,
        color: config.text_color || "#ffffff",
      }}
    >
      {config.label || "Button"}
    </a>
  );
}

// ─── Form link ───────────────────────────────────────────────

function FormLinkPreview({ widget }: { widget: Widget }) {
  const { config } = widget;
  const href = config.form_slug ? `/f/${config.form_slug}` : config.url || "#";
  const newTab = config.open_new_tab === "true";

  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className="flex items-center justify-center rounded-lg bg-brand-primary p-3 text-sm font-medium text-white hover:bg-brand-primary/90"
    >
      {config.label || "Open Form"}
    </a>
  );
}

// ─── Image ───────────────────────────────────────────────────

function ImagePreview({ widget }: { widget: Widget }) {
  const { config } = widget;
  if (!config.url) return null;

  const height = config.height ? `${config.height}px` : undefined;
  const objectFit = (config.object_fit as React.CSSProperties["objectFit"]) || "cover";
  const parallax = config.parallax === "true";

  if (parallax) {
    return (
      <div
        className="w-full rounded-lg bg-fixed bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${config.url})`,
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          height: height || "200px",
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={config.url}
      alt=""
      className="w-full rounded-lg"
      style={{
        height,
        objectFit,
      }}
    />
  );
}

// ─── Widget group ────────────────────────────────────────────

const GAP_MAP: Record<string, string> = {
  "1": "0.25rem",
  "2": "0.5rem",
  "4": "1rem",
  "6": "1.5rem",
};

function WidgetGroupPreview({ widget }: { widget: Widget }) {
  const { config, children = [] } = widget;
  const alignment = config.alignment || "center";
  const gap = GAP_MAP[config.gap || "2"] || "0.5rem";
  const direction = config.direction || "row";

  const justifyMap: Record<string, string> = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div
      className={`flex flex-wrap ${direction === "column" ? "flex-col" : ""} ${justifyMap[alignment] || "justify-center"}`}
      style={{ gap }}
    >
      {children.map((child) => (
        <WidgetPreview key={child.id} widget={child} />
      ))}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.has("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").pop();
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    // invalid URL, return as-is
  }
  return url;
}
