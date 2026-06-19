import type { ComponentConfig } from "@puckeditor/core";
import { mediaUrlField } from "../fields/media-url-field";

/**
 * Image — a single image with optional caption and link wrapper.
 *
 * Pairs with the existing `ImageGallery` block (multi-image grid). This one
 * is the simpler "drop one photo on the page" primitive — the most-requested
 * block alongside TextBlock.
 *
 * Outer section layout (paddingY/paddingX/marginY/maxWidth/background) is
 * handled by the shared `withLayoutFields` wrapper (registered in
 * `config.ts`). The fields below control the *image itself* inside that
 * section: how big the image is, how it's cropped, its corner radius, etc.
 *
 * Sizing model:
 *   * `imageWidth` is a fraction of the parent (auto / 1/4 / 1/3 / 1/2 /
 *     2/3 / 3/4 / full). Mirrors `Column.width` so editors who learn one
 *     learn the other.
 *   * `alignment` is left/center/right and only matters when `imageWidth`
 *     is less than `full` — otherwise the image fills the row anyway.
 *   * `aspectRatio` is `auto` (image's natural ratio) or a fixed crop ratio.
 *     A fixed ratio activates `object-fit` (cover by default) so different
 *     source images stay visually consistent in a row of cards.
 *
 * Link mode: identical to `Tile` — `<a>` when `url` is set (with optional
 * new-tab), `<div>` otherwise so a non-clickable image doesn't have a
 * dangling pointer cursor or empty href.
 */

export type ImageProps = {
  src: string;
  alt: string;
  caption: string;
  url: string;
  newTab: boolean;
  imageWidth:
    | "auto"
    | "1/4"
    | "1/3"
    | "1/2"
    | "2/3"
    | "3/4"
    | "full";
  alignment: "left" | "center" | "right";
  aspectRatio: "auto" | "1:1" | "4:3" | "16:9" | "3:2" | "21:9";
  objectFit: "cover" | "contain";
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
  shadow: "none" | "sm" | "md" | "lg";
};

const IMAGE_WIDTH_CLASS: Record<ImageProps["imageWidth"], string> = {
  // `auto` lets the image render at its natural width, capped at the
  // container — matches what most editors expect when they pick "auto".
  auto: "max-w-full h-auto",
  "1/4": "w-1/4",
  "1/3": "w-1/3",
  "1/2": "w-1/2",
  "2/3": "w-2/3",
  "3/4": "w-3/4",
  full: "w-full",
};

const ALIGNMENT_CLASS: Record<ImageProps["alignment"], string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

const ASPECT_CLASS: Record<ImageProps["aspectRatio"], string> = {
  auto: "",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-video",
  "3:2": "aspect-[3/2]",
  "21:9": "aspect-[21/9]",
};

const OBJECT_FIT_CLASS: Record<ImageProps["objectFit"], string> = {
  cover: "object-cover",
  contain: "object-contain",
};

const RADIUS_CLASS: Record<ImageProps["borderRadius"], string> = {
  none: "",
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

const SHADOW_CLASS: Record<ImageProps["shadow"], string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

export const ImageConfig: ComponentConfig<ImageProps> = {
  label: "Image",
  fields: {
    src: {
      ...mediaUrlField({ accept: "image", folderSlug: "website" }),
      label: "Image",
    },
    alt: {
      type: "text",
      label: "Alt text (for accessibility)",
    },
    caption: {
      type: "textarea",
      label: "Caption (optional)",
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
    imageWidth: {
      type: "select",
      label: "Image width",
      options: [
        { label: "Auto (natural size)", value: "auto" },
        { label: "1/4", value: "1/4" },
        { label: "1/3", value: "1/3" },
        { label: "1/2", value: "1/2" },
        { label: "2/3", value: "2/3" },
        { label: "3/4", value: "3/4" },
        { label: "Full width", value: "full" },
      ],
    },
    alignment: {
      type: "radio",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    aspectRatio: {
      type: "select",
      label: "Aspect ratio",
      options: [
        { label: "Auto (image's own ratio)", value: "auto" },
        { label: "1:1 (square)", value: "1:1" },
        { label: "4:3", value: "4:3" },
        { label: "16:9", value: "16:9" },
        { label: "3:2", value: "3:2" },
        { label: "21:9 (cinema)", value: "21:9" },
      ],
    },
    objectFit: {
      type: "radio",
      label: "Crop behavior (when aspect ratio is set)",
      options: [
        { label: "Cover (fills, may crop)", value: "cover" },
        { label: "Contain (fits, may letterbox)", value: "contain" },
      ],
    },
    borderRadius: {
      type: "select",
      label: "Corner radius",
      options: [
        { label: "None (square)", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Full (circle)", value: "full" },
      ],
    },
    shadow: {
      type: "select",
      label: "Shadow",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  },
  defaultProps: {
    src: "",
    alt: "",
    caption: "",
    url: "",
    newTab: false,
    imageWidth: "full",
    alignment: "center",
    aspectRatio: "auto",
    objectFit: "cover",
    borderRadius: "none",
    shadow: "none",
  },
  render: ({
    src,
    alt,
    caption,
    url,
    newTab,
    imageWidth,
    alignment,
    aspectRatio,
    objectFit,
    borderRadius,
    shadow,
  }) => {
    // Empty-state placeholder so editors see SOMETHING after dropping the
    // block in. Mirrors what ImageGallery does for an empty list.
    if (!src) {
      return (
        <div className="px-4 py-8">
          <div className="rounded-lg border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Pick an image to display
          </div>
        </div>
      );
    }

    // `aspect-*` only kicks in when set; otherwise the image renders at its
    // natural ratio. Object-fit only matters once a fixed aspect is forced —
    // omitting it on `auto` avoids an unnecessary class on the rendered DOM.
    const aspectClass = ASPECT_CLASS[aspectRatio];
    const fitClass = aspectRatio === "auto" ? "" : OBJECT_FIT_CLASS[objectFit];

    // Sizing rule: the WIDTH class lives on the *outermost* element that the
    // alignment flex parent sees (either the link wrapper or the bare <img>).
    // The visual classes (aspect/fit/radius/shadow) live on the <img> itself
    // so the image is what's clipped/rounded/shadowed. When wrapped in <a>,
    // the inner <img> stretches to fill the link box (`w-full`) — applying
    // the fraction width to both elements would double-shrink the image.
    const isLink = !!url;
    const widthClass = IMAGE_WIDTH_CLASS[imageWidth];
    // `auto` is special: the natural-size image needs `h-auto` and the link
    // wrapper sizes to its content. Other widths use the fraction class on
    // the wrapper and stretch the image to fill it.
    const innerImgWidthClass =
      imageWidth === "auto" ? "max-w-full h-auto" : "block w-full";

    const imgClassName = [
      "block",
      isLink ? innerImgWidthClass : widthClass,
      aspectClass,
      fitClass,
      RADIUS_CLASS[borderRadius],
      SHADOW_CLASS[shadow],
      // Aspect-ratio classes set height implicitly; without it we want the
      // image's natural height. With it, `h-full` lets object-fit do its job.
      aspectRatio === "auto" && !isLink ? "h-auto" : "",
      aspectRatio !== "auto" ? "h-full" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const imgEl = (
      <img
        src={src}
        alt={alt || ""}
        className={imgClassName}
        loading="lazy"
        decoding="async"
      />
    );

    const wrapped = isLink ? (
      <a
        href={url}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        // `inline-block` for the auto case (size-to-image), `block` + width
        // class for fractional widths.
        className={
          imageWidth === "auto" ? "inline-block max-w-full" : `block ${widthClass}`
        }
      >
        {imgEl}
      </a>
    ) : (
      imgEl
    );

    return (
      <figure className="m-0">
        <div className={`flex w-full ${ALIGNMENT_CLASS[alignment]}`}>
          {wrapped}
        </div>
        {caption && (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  },
};
