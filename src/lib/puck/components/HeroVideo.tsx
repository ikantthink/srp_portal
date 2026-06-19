import type { ComponentConfig } from "@puckeditor/core";

// Supported videoUrl formats:
//   * direct .mp4 (and similar) URL → rendered via <video>
//   * youtube.com / youtu.be / vimeo.com URL → rendered via <iframe>
// Other URLs render as a still placeholder.

export type HeroVideoProps = {
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string;
  videoUrl: string;
  posterUrl: string;
  playback: "loop" | "playOnce" | "loopMuted";
  overlay: "none" | "light" | "dark";
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
  minHeight: "sm" | "md" | "lg" | "full";
};

const ALIGNMENT_CLASSES: Record<HeroVideoProps["contentAlignment"], string> = {
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

const MIN_HEIGHT_CLASSES: Record<HeroVideoProps["minHeight"], string> = {
  sm: "min-h-[320px] sm:min-h-[400px]",
  md: "min-h-[420px] sm:min-h-[600px]",
  lg: "min-h-[520px] sm:min-h-[800px]",
  full: "min-h-screen",
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

export const HeroVideoConfig: ComponentConfig<HeroVideoProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    ctaText: { type: "text" },
    ctaLink: { type: "text" },
    videoUrl: { type: "text" },
    posterUrl: { type: "text" },
    playback: {
      type: "radio",
      options: [
        // loopMuted is the default because browsers block autoplay with sound.
        { label: "Loop (muted)", value: "loopMuted" },
        { label: "Loop", value: "loop" },
        { label: "Play once", value: "playOnce" },
      ],
    },
    overlay: {
      type: "radio",
      options: [
        { label: "None", value: "none" },
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
      ],
    },
    contentAlignment: {
      type: "select",
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
    minHeight: {
      type: "radio",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Full screen", value: "full" },
      ],
    },
  },
  defaultProps: {
    heading: "Welcome Home",
    subheading: "Find your place in the neighborhood you love.",
    ctaText: "Get Started",
    ctaLink: "/contact",
    videoUrl: "",
    posterUrl: "",
    playback: "loopMuted",
    overlay: "dark",
    contentAlignment: "center-center",
    minHeight: "md",
  },
  render: ({
    heading,
    subheading,
    ctaText,
    ctaLink,
    videoUrl,
    posterUrl,
    playback,
    overlay,
    contentAlignment,
    minHeight,
    puck,
  }) => {
    const overlayClass =
      overlay === "dark" ? "bg-black/50" : overlay === "light" ? "bg-white/40" : "";
    const isLightOverlay = overlay === "light";
    const isEditing = puck?.isEditing;
    const kind = getEmbedKind(videoUrl);
    const loop = playback === "loop" || playback === "loopMuted";
    const muted = playback === "loopMuted";
    const autoplay = true;

    return (
      <section
        className={`relative flex w-full overflow-hidden px-4 py-12 sm:px-6 sm:py-16 ${MIN_HEIGHT_CLASSES[minHeight]} ${ALIGNMENT_CLASSES[contentAlignment]}`}
        style={{
          backgroundImage: posterUrl ? `url(${posterUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: posterUrl ? undefined : "var(--brand-primary)",
        }}
      >
        {/* Editing preview: avoid loading/playing video while in Puck. */}
        {!isEditing && videoUrl && (
          <div className="absolute inset-0 h-full w-full">
            {kind === "mp4" ? (
              <video
                className="h-full w-full object-cover"
                src={videoUrl}
                poster={posterUrl || undefined}
                autoPlay={autoplay}
                muted={muted}
                loop={loop}
                playsInline
                controls={false}
              />
            ) : kind === "youtube" ? (
              <iframe
                className="h-full w-full"
                src={getYouTubeEmbed(videoUrl, autoplay, loop, muted)}
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : kind === "vimeo" ? (
              <iframe
                className="h-full w-full"
                src={getVimeoEmbed(videoUrl, autoplay, loop, muted)}
                allow="autoplay; fullscreen; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : null}
          </div>
        )}

        {overlayClass && !isEditing && (
          <div className={`absolute inset-0 ${overlayClass}`} aria-hidden="true" />
        )}

        {isEditing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-center text-white">
            <div className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide opacity-75">Hero Video</p>
              <p className="text-sm font-medium">{videoUrl || "No video URL configured"}</p>
              <p className="text-xs opacity-75">Preview disabled while editing</p>
            </div>
          </div>
        )}

        <div
          className={`relative z-10 flex max-w-3xl flex-col gap-4 ${isLightOverlay ? "text-foreground" : "text-white"}`}
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl">{heading}</h1>
          {subheading && (
            <p className={`text-base sm:text-lg md:text-xl ${isLightOverlay ? "text-foreground/80" : "text-white/90"}`}>
              {subheading}
            </p>
          )}
          {ctaText && (
            <div>
              <a
                href={ctaLink}
                className="inline-flex h-11 items-center rounded-lg bg-brand-accent px-6 font-semibold text-black transition-opacity hover:opacity-90 sm:h-12 sm:px-8"
                style={{ backgroundColor: "var(--brand-accent)" }}
              >
                {ctaText}
              </a>
            </div>
          )}
        </div>
      </section>
    );
  },
};
