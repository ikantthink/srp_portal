import type { ComponentConfig, Slot } from "@puckeditor/core";
import { colorField } from "../fields/color-field";

/**
 * Column — drop target inside a `Row`. Each column is a flex item with its
 * own width, alignment, padding, margin, and optional background.
 *
 * Why this opts out of `withLayoutFields`:
 *   * The outermost element of a Column has to be the flex item that the
 *     parent Row positions (so width and margin live on the right node).
 *     `withLayoutFields` adds an extra wrapper div with hardcoded layout
 *     classes — combining the two would force width onto the inner div and
 *     break the grid math.
 *   * Column also needs `marginX` (sideways margin between columns) which
 *     `withLayoutFields` doesn't expose.
 *
 * Width strategy: a small set of preset fractions instead of 12-column
 * units. Editors think in halves/thirds/quarters; "auto" maps to flex-1 so
 * mixed columns (e.g. one fixed 1/4 + two `auto`) split the remaining space.
 *
 * Content slot disallows `Row` and `Column` to prevent infinite nesting that
 * makes the editor outline unreadable. (Nested rows are still possible by
 * adding a Row at the page level next to the parent — the constraint is
 * just on direct nesting.)
 */

export type ColumnProps = {
  width:
    | "auto"
    | "1/4"
    | "1/3"
    | "1/2"
    | "2/3"
    | "3/4"
    | "full";
  horizontalAlignment: "start" | "center" | "end" | "stretch";
  verticalAlignment: "top" | "center" | "bottom" | "between";
  paddingY: "none" | "sm" | "md" | "lg" | "xl";
  paddingX: "none" | "sm" | "md" | "lg" | "xl";
  marginY: "none" | "sm" | "md" | "lg";
  marginX: "none" | "sm" | "md" | "lg";
  background:
    | "none"
    | "muted"
    | "brand-primary"
    | "brand-secondary"
    | "brand-accent"
    | "custom";
  backgroundColor: string;
  content: Slot;
};

// Mobile is full-width (stacked rows). Desktop applies the chosen fraction.
// `md:flex-1` for "auto" lets mixed columns share remaining space; the
// fixed-fraction options pin width regardless of siblings.
const WIDTH_CLASS: Record<ColumnProps["width"], string> = {
  auto: "w-full md:flex-1",
  "1/4": "w-full md:w-1/4 md:flex-none",
  "1/3": "w-full md:w-1/3 md:flex-none",
  "1/2": "w-full md:w-1/2 md:flex-none",
  "2/3": "w-full md:w-2/3 md:flex-none",
  "3/4": "w-full md:w-3/4 md:flex-none",
  full: "w-full",
};

// Inside flex-col, items-* controls the horizontal (cross) axis. items-stretch
// fills the column width — useful when the content is a Tile or full-width
// block. The other values let the content shrink to its own intrinsic width
// and align left/center/right.
const H_ALIGN_CLASS: Record<ColumnProps["horizontalAlignment"], string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

// Inside flex-col, justify-* is the vertical (main) axis. `between` spaces
// children to the top and bottom of the column — useful for card-like layouts
// with a heading at top and a CTA at the bottom.
const V_ALIGN_CLASS: Record<ColumnProps["verticalAlignment"], string> = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
  between: "justify-between",
};

const PADDING_Y_CLASS: Record<ColumnProps["paddingY"], string> = {
  none: "py-0",
  sm: "py-2",
  md: "py-4",
  lg: "py-8",
  xl: "py-12",
};

const PADDING_X_CLASS: Record<ColumnProps["paddingX"], string> = {
  none: "px-0",
  sm: "px-2",
  md: "px-4",
  lg: "px-8",
  xl: "px-12",
};

const MARGIN_Y_CLASS: Record<ColumnProps["marginY"], string> = {
  none: "my-0",
  sm: "my-2",
  md: "my-4",
  lg: "my-8",
};

const MARGIN_X_CLASS: Record<ColumnProps["marginX"], string> = {
  none: "mx-0",
  sm: "mx-2",
  md: "mx-4",
  lg: "mx-8",
};

const BACKGROUND_CLASS: Record<
  Exclude<ColumnProps["background"], "custom" | "none">,
  string
> = {
  muted: "bg-muted",
  "brand-primary": "bg-brand-primary text-white",
  "brand-secondary": "bg-brand-secondary text-white",
  "brand-accent": "bg-brand-accent text-black",
};

export const ColumnConfig: ComponentConfig<ColumnProps> = {
  label: "Column",
  fields: {
    width: {
      type: "select",
      label: "Width (desktop)",
      options: [
        { label: "Auto (share with siblings)", value: "auto" },
        { label: "1/4", value: "1/4" },
        { label: "1/3", value: "1/3" },
        { label: "1/2", value: "1/2" },
        { label: "2/3", value: "2/3" },
        { label: "3/4", value: "3/4" },
        { label: "Full", value: "full" },
      ],
    },
    horizontalAlignment: {
      type: "select",
      label: "Horizontal alignment",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
        { label: "Stretch (full width)", value: "stretch" },
      ],
    },
    verticalAlignment: {
      type: "select",
      label: "Vertical alignment",
      options: [
        { label: "Top", value: "top" },
        { label: "Center", value: "center" },
        { label: "Bottom", value: "bottom" },
        { label: "Space between", value: "between" },
      ],
    },
    paddingY: {
      type: "select",
      label: "Vertical padding",
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
      label: "Horizontal padding",
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
      label: "Vertical margin",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    marginX: {
      type: "select",
      label: "Horizontal margin",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    background: {
      type: "select",
      label: "Background",
      options: [
        { label: "None", value: "none" },
        { label: "Muted", value: "muted" },
        { label: "Brand primary", value: "brand-primary" },
        { label: "Brand secondary", value: "brand-secondary" },
        { label: "Brand accent", value: "brand-accent" },
        { label: "Custom color\u2026", value: "custom" },
      ],
    },
    backgroundColor: {
      ...colorField({ fallback: "#ffffff" }),
      label: "Custom background color",
    },
    content: {
      type: "slot",
      // Direct nesting of Row/Column would explode the editor outline. Other
      // blocks (Tile, TextBlock, ImageGallery, etc.) are fine.
      disallow: ["Row", "Column"],
    },
  },
  defaultProps: {
    width: "auto",
    horizontalAlignment: "stretch",
    verticalAlignment: "top",
    paddingY: "md",
    paddingX: "md",
    marginY: "none",
    marginX: "none",
    background: "none",
    backgroundColor: "",
    content: [],
  },
  render: ({
    width,
    horizontalAlignment,
    verticalAlignment,
    paddingY,
    paddingX,
    marginY,
    marginX,
    background,
    backgroundColor,
    content: Content,
  }) => {
    const widthClass = WIDTH_CLASS[width] ?? WIDTH_CLASS.auto;
    const marginClass = [MARGIN_Y_CLASS[marginY], MARGIN_X_CLASS[marginX]]
      .filter(Boolean)
      .join(" ");

    const bgClass =
      background !== "none" && background !== "custom"
        ? BACKGROUND_CLASS[background]
        : "";
    const bgStyle =
      background === "custom" && backgroundColor
        ? { backgroundColor }
        : undefined;

    const innerClasses = [
      "flex flex-col h-full",
      H_ALIGN_CLASS[horizontalAlignment] ?? H_ALIGN_CLASS.stretch,
      V_ALIGN_CLASS[verticalAlignment] ?? V_ALIGN_CLASS.top,
      PADDING_Y_CLASS[paddingY],
      PADDING_X_CLASS[paddingX],
      bgClass,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`${widthClass} ${marginClass}`.trim()}>
        <Content
          as="div"
          className={innerClasses}
          style={bgStyle}
          // Empty columns need a visible drop target in the editor; without
          // this the column collapses to 0 height when nothing is inside.
          minEmptyHeight={80}
        />
      </div>
    );
  },
};
