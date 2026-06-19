import type { ComponentConfig } from "@puckeditor/core";
import { mediaUrlField } from "../fields/media-url-field";
import { wysiwygField } from "../fields/wysiwyg-field";
import { colorField } from "../fields/color-field";
import { FONT_OPTIONS } from "../fields/font-options";
import { stripDangerousTags } from "../fields/sanitize-html";

/**
 * Tile — a linkable, image-backed card with a WYSIWYG body and a hover-only
 * color overlay.
 *
 * Why this opts out of `withLayoutFields`:
 *   * The tile's background image needs to fill edge-to-edge of the visible
 *     card, so padding belongs *inside* the colored region (between the body
 *     and the image edges) — same reasoning as `HeroFlex`. The shared
 *     `withLayoutFields` puts padding on an *outer* wrapper, which would
 *     instead push the whole tile away from its column edges.
 *   * Tiles inside a Column slot inherit row-level alignment from their
 *     parent. Adding the standard `maxWidth` field would surprise editors
 *     who expect the tile to fill its column.
 *
 * Hover overlay:
 *   * Always rendered as a sibling layer; CSS controls its opacity. We use a
 *     CSS variable (`--tile-hover-opacity`) set per-instance via inline
 *     style, plus a single shared CSS rule scoped to `.srp-tile`. Multiple
 *     tiles on the same page share the rule (browsers dedupe identical
 *     `<style>` content), and each gets its own opacity through the var.
 *
 * Link mode:
 *   * `url` is optional. With a URL the tile renders as `<a>` (whole-tile
 *     clickable, with `cursor-pointer`); empty URL renders as `<div>` so the
 *     hover effect doesn't dangle without a destination.
 *   * `newTab` adds `target="_blank" rel="noopener noreferrer"`.
 */

export type TileProps = {
  backgroundImage: string;
  url: string;
  newTab: boolean;
  hoverOverlayColor: string;
  hoverOverlayOpacity: number;
  contentAlignment:
    | "top-left"
    | "top-center"
    | "top-right"
    | "center-left"
    | "center-center"
    | "center-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  height: "sm" | "md" | "lg" | "full" | "custom";
  customHeight: string;
  paddingY: "none" | "sm" | "md" | "lg" | "xl";
  paddingX: "none" | "sm" | "md" | "lg" | "xl";
  marginY: "none" | "sm" | "md" | "lg";
  contentMaxWidth: "narrow" | "default" | "wide" | "full";
  defaultTextColor: string;
  defaultFontFamily: string;
  content: string;
};

const ALIGNMENT_CLASSES: Record<TileProps["contentAlignment"], string> = {
  "top-left": "items-start justify-start text-left",
  "top-center": "items-start justify-center text-center",
  "top-right": "items-start justify-end text-right",
  "center-left": "items-center justify-start text-left",
  "center-center": "items-center justify-center text-center",
  "center-right": "items-center justify-end text-right",
  "bottom-left": "items-end justify-start text-left",
  "bottom-center": "items-end justify-center text-center",
  "bottom-right": "items-end justify-end text-right",
};

const HEIGHT_CLASSES: Record<Exclude<TileProps["height"], "custom">, string> = {
  sm: "min-h-[200px] sm:min-h-[240px]",
  md: "min-h-[280px] sm:min-h-[360px]",
  lg: "min-h-[400px] sm:min-h-[520px]",
  full: "min-h-screen",
};

const PADDING_Y_CLASSES: Record<TileProps["paddingY"], string> = {
  none: "py-0",
  sm: "py-3",
  md: "py-6 sm:py-8",
  lg: "py-10 sm:py-14",
  xl: "py-14 sm:py-20",
};

const PADDING_X_CLASSES: Record<TileProps["paddingX"], string> = {
  none: "px-0",
  sm: "px-3",
  md: "px-4 sm:px-6",
  lg: "px-6 sm:px-10",
  xl: "px-8 sm:px-14",
};

const MARGIN_Y_CLASSES: Record<TileProps["marginY"], string> = {
  none: "",
  sm: "my-2",
  md: "my-4",
  lg: "my-8",
};

const CONTENT_MAX_WIDTH_CLASSES: Record<TileProps["contentMaxWidth"], string> = {
  narrow: "max-w-xs",
  default: "max-w-md",
  wide: "max-w-2xl",
  full: "max-w-none w-full",
};

// Clamp 0–100; the slider can serialise floats and we need a predictable
// value for the CSS variable.
function clampOpacity(v: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

// Single shared style block. Each tile adds it; the browser parses each but
// the duplicate rules are harmless. Scoped to `.srp-tile` so it can't bleed
// into other components.
const TILE_STYLES = `
  .srp-tile { position: relative; overflow: hidden; isolation: isolate; }
  .srp-tile-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 200ms ease;
  }
  .srp-tile:hover .srp-tile-overlay,
  .srp-tile:focus-visible .srp-tile-overlay {
    opacity: var(--srp-tile-hover-opacity, 0.5);
  }
  .srp-tile-content :first-child { margin-top: 0; }
  .srp-tile-content :last-child  { margin-bottom: 0; }
  .srp-tile-content h1 { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; line-height: 1.1; margin: 0 0 0.75rem; }
  .srp-tile-content h2 { font-size: clamp(1.25rem, 2.5vw, 1.875rem); font-weight: 700; line-height: 1.15; margin: 0 0 0.5rem; }
  .srp-tile-content h3 { font-size: clamp(1.125rem, 2vw, 1.5rem); font-weight: 600; line-height: 1.2; margin: 0 0 0.5rem; }
  .srp-tile-content h4 { font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem; }
  .srp-tile-content p  { font-size: 1rem; line-height: 1.5; margin: 0 0 0.75rem; }
  .srp-tile-content a  { text-decoration: underline; }
  .srp-tile-content blockquote { border-left: 3px solid currentColor; padding-left: 0.75rem; opacity: 0.85; margin: 0.5rem 0; }
`;

export const TileConfig: ComponentConfig<TileProps> = {
  label: "Tile",
  fields: {
    backgroundImage: {
      ...mediaUrlField({ accept: "image", folderSlug: "website" }),
      label: "Background image",
    },
    url: {
      type: "text",
      label: "Link URL (optional)",
    },
    newTab: {
      type: "radio",
      label: "Open link in new tab",
      options: [
        { label: "Same tab", value: false },
        { label: "New tab", value: true },
      ],
    },
    hoverOverlayColor: {
      ...colorField({ fallback: "#000000" }),
      label: "Hover overlay color",
    },
    hoverOverlayOpacity: {
      type: "number",
      label: "Hover overlay opacity (0\u2013100)",
      min: 0,
      max: 100,
    },
    contentAlignment: {
      type: "select",
      label: "Content position",
      options: [
        { label: "Top Left", value: "top-left" },
        { label: "Top Center", value: "top-center" },
        { label: "Top Right", value: "top-right" },
        { label: "Center Left", value: "center-left" },
        { label: "Center Center", value: "center-center" },
        { label: "Center Right", value: "center-right" },
        { label: "Bottom Left", value: "bottom-left" },
        { label: "Bottom Center", value: "bottom-center" },
        { label: "Bottom Right", value: "bottom-right" },
      ],
    },
    height: {
      type: "select",
      label: "Tile height",
      options: [
        { label: "Small (~240px)", value: "sm" },
        { label: "Medium (~360px)", value: "md" },
        { label: "Large (~520px)", value: "lg" },
        { label: "Full screen", value: "full" },
        { label: "Custom\u2026", value: "custom" },
      ],
    },
    customHeight: {
      type: "text",
      label: "Custom height (CSS, e.g. 50vh or 480px)",
    },
    paddingY: {
      type: "select",
      label: "Vertical padding (inside tile)",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra large", value: "xl" },
      ],
    },
    paddingX: {
      type: "select",
      label: "Horizontal padding (inside tile)",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra large", value: "xl" },
      ],
    },
    marginY: {
      type: "select",
      label: "Vertical margin (outside tile)",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    contentMaxWidth: {
      type: "select",
      label: "Content width",
      options: [
        { label: "Narrow", value: "narrow" },
        { label: "Default", value: "default" },
        { label: "Wide", value: "wide" },
        { label: "Full", value: "full" },
      ],
    },
    defaultTextColor: {
      ...colorField({ fallback: "#ffffff" }),
      label: "Default text color",
    },
    defaultFontFamily: {
      type: "select",
      label: "Default font",
      options: FONT_OPTIONS.map((f) => ({ label: f.label, value: f.value })),
    },
    content: {
      ...wysiwygField({
        minHeight: "180px",
        placeholder: "Tile heading and supporting text\u2026",
      }),
      label: "Content",
    },
  },
  defaultProps: {
    backgroundImage: "",
    url: "",
    newTab: false,
    hoverOverlayColor: "#000000",
    hoverOverlayOpacity: 50,
    contentAlignment: "bottom-left",
    height: "md",
    customHeight: "",
    paddingY: "md",
    paddingX: "md",
    marginY: "none",
    contentMaxWidth: "default",
    defaultTextColor: "#ffffff",
    defaultFontFamily: "",
    content: "<h3>Tile heading</h3><p>Short supporting copy.</p>",
  },
  render: ({
    backgroundImage,
    url,
    newTab,
    hoverOverlayColor,
    hoverOverlayOpacity,
    contentAlignment,
    height,
    customHeight,
    paddingY,
    paddingX,
    marginY,
    contentMaxWidth,
    defaultTextColor,
    defaultFontFamily,
    content,
  }) => {
    const opacity = clampOpacity(hoverOverlayOpacity) / 100;

    // Render trust: WYSIWYG sanitises on every edit. The regex sweep here is
    // a backstop in case JSON gets hand-edited or imported from elsewhere
    // (mirrors HeroFlex / TextBlock).
    const safeContent = stripDangerousTags(content || "");

    const heightClass =
      height === "custom" ? "" : HEIGHT_CLASSES[height] ?? HEIGHT_CLASSES.md;
    const heightStyle =
      height === "custom" && customHeight ? { minHeight: customHeight } : undefined;

    const layoutClasses = [
      "srp-tile flex w-full",
      PADDING_Y_CLASSES[paddingY],
      PADDING_X_CLASSES[paddingX],
      MARGIN_Y_CLASSES[marginY],
      heightClass,
      ALIGNMENT_CLASSES[contentAlignment],
    ]
      .filter(Boolean)
      .join(" ");

    const wrapperStyle: React.CSSProperties = {
      backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: backgroundImage ? undefined : "var(--muted)",
      color: defaultTextColor || undefined,
      fontFamily: defaultFontFamily || undefined,
      // Per-instance hover opacity surfaced through the shared CSS rule.
      // Cast: React's CSSProperties doesn't model custom properties.
      ["--srp-tile-hover-opacity" as string]: String(opacity),
      ...heightStyle,
    };

    const isLink = !!url;
    // We render <a> only when url is present so the hover affordance and
    // pointer cursor don't appear on a non-clickable card. Tailwind's
    // `cursor-pointer` is added unconditionally to the <a> branch.
    const className = `${layoutClasses} ${isLink ? "cursor-pointer" : ""}`.trim();

    const inner = (
      <>
        <span
          className="srp-tile-overlay"
          aria-hidden="true"
          style={{ backgroundColor: hoverOverlayColor || "#000000" }}
        />
        <div
          className={`srp-tile-content relative z-10 ${CONTENT_MAX_WIDTH_CLASSES[contentMaxWidth]}`}
          // Sanitised HTML; see `safeContent`.
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
        <style>{TILE_STYLES}</style>
      </>
    );

    if (isLink) {
      return (
        <a
          href={url}
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener noreferrer" : undefined}
          className={className}
          style={wrapperStyle}
        >
          {inner}
        </a>
      );
    }

    return (
      <div className={className} style={wrapperStyle}>
        {inner}
      </div>
    );
  },
};
