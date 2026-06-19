import type { ComponentConfig } from "@puckeditor/core";
import { mediaUrlField } from "../fields/media-url-field";
import { wysiwygField } from "../fields/wysiwyg-field";
import { colorField } from "../fields/color-field";
import { FONT_OPTIONS } from "../fields/font-options";
import { stripDangerousTags } from "../fields/sanitize-html";

/**
 * HeroFlex — a single hero block that supports either an image OR video
 * background, a fully configurable color/opacity overlay, 9-position
 * content alignment, and a WYSIWYG body for headings + paragraphs + links
 * with per-element font/colour control.
 *
 * Why this lives alongside `Hero` and `HeroVideo` rather than replacing
 * them: existing pages reference the older blocks by name in their
 * persisted Puck JSON. Adding a new block keeps the old content rendering
 * verbatim and lets editors adopt the richer block on a page-by-page basis.
 *
 * Video URL handling mirrors `HeroVideo` (direct .mp4, YouTube, Vimeo). See
 * the inline helpers below — kept local rather than extracted because the
 * two blocks are likely to diverge over time (HeroVideo has a different UX
 * around the playback toggle).
 */

export type HeroFlexProps = {
  backgroundType: "image" | "video";
  backgroundImage: string;
  backgroundVideo: string;
  posterUrl: string;
  videoPlayback: "loopMuted" | "loop" | "playOnce";
  overlayColor: string;
  overlayOpacity: number;
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
  /** Free-form CSS height/min-height used when `height === "custom"`.
   *  Accepts any valid CSS length: `600px`, `75vh`, `50%`, etc. */
  customHeight: string;
  paddingY: "none" | "sm" | "md" | "lg" | "xl";
  paddingX: "none" | "sm" | "md" | "lg" | "xl";
  marginY: "none" | "sm" | "md" | "lg";
  contentMaxWidth: "narrow" | "default" | "wide" | "full";
  defaultTextColor: string;
  defaultFontFamily: string;
  content: string;
};

const ALIGNMENT_CLASSES: Record<HeroFlexProps["contentAlignment"], string> = {
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

const MIN_HEIGHT_CLASSES: Record<Exclude<HeroFlexProps["height"], "custom">, string> = {
  sm: "min-h-[320px] sm:min-h-[400px]",
  md: "min-h-[420px] sm:min-h-[600px]",
  lg: "min-h-[520px] sm:min-h-[800px]",
  full: "min-h-screen",
};

// Padding scales:
//   * `md` reproduces the rhythm the rest of the site uses (Hero /
//     HeroVideo / CallToAction / TextBlock all ship with
//     `px-4 py-12 sm:px-6 sm:py-16`), so the default HeroFlex visually
//     matches every other section out of the box.
//   * `lg` / `xl` step up at larger breakpoints because heroes are
//     full-bleed — a flat 40 px on a 1500 px viewport visually disappears.
//     The values below scale with `sm` / `lg` / `xl` breakpoints so a
//     "Large" pick actually feels large on desktop without overwhelming
//     mobile.
const PADDING_Y_CLASSES: Record<HeroFlexProps["paddingY"], string> = {
  none: "py-0",
  sm: "py-6 sm:py-8",
  md: "py-12 sm:py-16",
  lg: "py-16 sm:py-24 lg:py-32",
  xl: "py-24 sm:py-32 lg:py-48",
};

const PADDING_X_CLASSES: Record<HeroFlexProps["paddingX"], string> = {
  none: "px-0",
  sm: "px-3 sm:px-4",
  md: "px-4 sm:px-6 lg:px-8",
  lg: "px-6 sm:px-12 lg:px-20 xl:px-32",
  xl: "px-8 sm:px-16 lg:px-32 xl:px-48",
};

const MARGIN_Y_CLASSES: Record<HeroFlexProps["marginY"], string> = {
  none: "",
  sm: "my-4",
  md: "my-8",
  lg: "my-12",
};

const CONTENT_MAX_WIDTH_CLASSES: Record<HeroFlexProps["contentMaxWidth"], string> = {
  narrow: "max-w-xl",
  default: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-none w-full",
};

function getEmbedKind(url: string): "mp4" | "youtube" | "vimeo" | "unknown" {
  if (!url) return "unknown";
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return "mp4";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  return "unknown";
}

function getYouTubeEmbed(url: string, autoplay: boolean, loop: boolean, muted: boolean): string {
  const idMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?#/]+)/);
  const id = idMatch?.[1];
  if (!id) return "";
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
    loop: loop ? "1" : "0",
    controls: "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
  });
  if (loop) params.set("playlist", id);
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

function getVimeoEmbed(url: string, autoplay: boolean, loop: boolean, muted: boolean): string {
  const idMatch = url.match(/vimeo\.com\/(\d+)/);
  const id = idMatch?.[1];
  if (!id) return "";
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    muted: muted ? "1" : "0",
    loop: loop ? "1" : "0",
    background: muted && loop ? "1" : "0",
    controls: "0",
  });
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}

// Clamp 0–100 because the slider sometimes serialises floats and we need a
// predictable value for the `opacity` style.
function clampOpacity(v: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

export const HeroFlexConfig: ComponentConfig<HeroFlexProps> = {
  label: "Hero (Flex)",
  fields: {
    backgroundType: {
      type: "radio",
      label: "Background type",
      options: [
        { label: "Image", value: "image" },
        { label: "Video", value: "video" },
      ],
    },
    backgroundImage: {
      ...mediaUrlField({ accept: "image", folderSlug: "website" }),
      label: "Background image",
    },
    backgroundVideo: {
      ...mediaUrlField({
        accept: "video",
        folderSlug: "website",
        placeholder: "https://… (mp4, YouTube, or Vimeo)",
      }),
      label: "Background video",
    },
    posterUrl: {
      ...mediaUrlField({ accept: "image", folderSlug: "website" }),
      label: "Video poster / fallback image",
    },
    videoPlayback: {
      type: "radio",
      label: "Video playback",
      options: [
        { label: "Loop (muted)", value: "loopMuted" },
        { label: "Loop (with audio)", value: "loop" },
        { label: "Play once", value: "playOnce" },
      ],
    },
    overlayColor: {
      ...colorField({ fallback: "#000000" }),
      label: "Overlay color",
    },
    overlayOpacity: {
      type: "number",
      label: "Overlay opacity (0–100)",
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
      label: "Section height",
      options: [
        { label: "Small (~400px)", value: "sm" },
        { label: "Medium (~600px)", value: "md" },
        { label: "Large (~800px)", value: "lg" },
        { label: "Full screen", value: "full" },
        { label: "Custom…", value: "custom" },
      ],
    },
    customHeight: {
      type: "text",
      label: "Custom height (CSS, e.g. 75vh or 720px)",
    },
    paddingY: {
      type: "select",
      label: "Vertical padding",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium (site default)", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra large", value: "xl" },
      ],
    },
    paddingX: {
      type: "select",
      label: "Horizontal padding",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium (site default)", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra large", value: "xl" },
      ],
    },
    marginY: {
      type: "select",
      label: "Vertical margin (outside section)",
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
        minHeight: "220px",
        placeholder: "Add your heading, subheading, paragraph…",
      }),
      label: "Content",
    },
  },
  defaultProps: {
    backgroundType: "image",
    backgroundImage: "",
    backgroundVideo: "",
    posterUrl: "",
    videoPlayback: "loopMuted",
    overlayColor: "#000000",
    overlayOpacity: 40,
    contentAlignment: "center-center",
    height: "md",
    customHeight: "",
    // `md` paddingY/paddingX reproduces the existing `px-4 py-12 sm:px-6
    // sm:py-16` rhythm used by Hero / HeroVideo / TextBlock — so the
    // out-of-the-box HeroFlex visually matches every other block.
    paddingY: "md",
    paddingX: "md",
    marginY: "none",
    contentMaxWidth: "default",
    defaultTextColor: "#ffffff",
    defaultFontFamily: "",
    content:
      "<h1>Find Your Dream Home</h1><p>We help you navigate the real estate market with confidence.</p>",
  },
  render: ({
    backgroundType,
    backgroundImage,
    backgroundVideo,
    posterUrl,
    videoPlayback,
    overlayColor,
    overlayOpacity,
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
    puck,
  }) => {
    const isEditing = puck?.isEditing;
    const isVideo = backgroundType === "video";
    const kind = isVideo ? getEmbedKind(backgroundVideo) : "unknown";
    const loop = videoPlayback === "loop" || videoPlayback === "loopMuted";
    const muted = videoPlayback === "loopMuted";
    const opacity = clampOpacity(overlayOpacity) / 100;

    // The poster doubles as the still-image fallback for image-mode and the
    // visible background while the video loads in video-mode.
    const stillBackground = isVideo ? posterUrl : backgroundImage;

    // Render trust: `content` is sanitised by the WYSIWYG field on every
    // edit. We still run a regex sweep here as a backstop in case someone
    // hand-edits the saved JSON or pastes unsafe HTML directly via an
    // import path that bypasses the editor.
    const safeContent = stripDangerousTags(content || "");

    // Height: preset → Tailwind class; "custom" → inline min-height. Custom
    // wins when set; otherwise we render the preset class. Empty custom
    // value falls back to medium so the user always sees *something*.
    const heightClass =
      height === "custom" ? "" : MIN_HEIGHT_CLASSES[height] ?? MIN_HEIGHT_CLASSES.md;
    const heightStyle =
      height === "custom" && customHeight ? { minHeight: customHeight } : undefined;

    // Padding/margin lives on the section (which carries the background)
    // so the background-image fills the visible area edge-to-edge and the
    // padding insets the content INSIDE the colored region — instead of
    // pushing the section away from the page edges.
    const layoutClasses = [
      PADDING_Y_CLASSES[paddingY],
      PADDING_X_CLASSES[paddingX],
      MARGIN_Y_CLASSES[marginY],
      heightClass,
      ALIGNMENT_CLASSES[contentAlignment],
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <section
        className={`relative flex w-full overflow-hidden ${layoutClasses}`}
        style={{
          backgroundImage: stillBackground ? `url(${stillBackground})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: stillBackground ? undefined : "var(--brand-primary)",
          ...heightStyle,
        }}
      >
        {/* Video layer — skipped while editing in Puck so the iframe/video
            doesn't autoplay over the editable content. */}
        {isVideo && !isEditing && backgroundVideo && (
          <div className="absolute inset-0 h-full w-full">
            {kind === "mp4" ? (
              <video
                className="h-full w-full object-cover"
                src={backgroundVideo}
                poster={posterUrl || undefined}
                autoPlay
                muted={muted}
                loop={loop}
                playsInline
                controls={false}
              />
            ) : kind === "youtube" ? (
              <iframe
                className="h-full w-full"
                src={getYouTubeEmbed(backgroundVideo, true, loop, muted)}
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : kind === "vimeo" ? (
              <iframe
                className="h-full w-full"
                src={getVimeoEmbed(backgroundVideo, true, loop, muted)}
                allow="autoplay; fullscreen; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : null}
          </div>
        )}

        {/* Overlay tints sit above the background but below the content. We
            always render the layer (even at 0 opacity) so transitions stay
            smooth if someone later wires up a hover/scroll effect. */}
        {opacity > 0 && (
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundColor: overlayColor || "#000000",
              opacity,
            }}
          />
        )}

        {/* Editor preview hint: when no media is set we don't have anything
            visible behind the content; show a small label so editors know
            what they're looking at. */}
        {isEditing && !stillBackground && !backgroundVideo && (
          <div className="absolute right-3 top-3 z-10 rounded bg-black/60 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
            HeroFlex · add a background
          </div>
        )}

        <div
          className={`hero-flex-content relative z-10 ${CONTENT_MAX_WIDTH_CLASSES[contentMaxWidth]}`}
          style={{
            color: defaultTextColor || undefined,
            fontFamily: defaultFontFamily || undefined,
          }}
          // Sanitised HTML from the WYSIWYG. See `safeContent` above.
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />

        {/* Typographic defaults for the rendered HTML. Scoped to
            `.hero-flex-content` so it doesn't leak into other blocks. */}
        <style>{`
          .hero-flex-content :first-child { margin-top: 0; }
          .hero-flex-content :last-child  { margin-bottom: 0; }
          .hero-flex-content h1 { font-size: clamp(2rem, 5vw, 3.75rem); font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; margin: 0 0 1rem; }
          .hero-flex-content h2 { font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 700; line-height: 1.1;  letter-spacing: -0.01em; margin: 0 0 0.75rem; }
          .hero-flex-content h3 { font-size: clamp(1.25rem, 3vw, 1.875rem); font-weight: 600; line-height: 1.2; margin: 0 0 0.5rem; }
          .hero-flex-content h4 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; }
          .hero-flex-content p  { font-size: clamp(1rem, 1.5vw, 1.25rem); line-height: 1.5; margin: 0 0 1rem; }
          .hero-flex-content a  { text-decoration: underline; }
          .hero-flex-content blockquote { border-left: 3px solid currentColor; padding-left: 1rem; opacity: 0.85; margin: 0.5rem 0; }
        `}</style>
      </section>
    );
  },
};
