import type { ComponentConfig, Slot } from "@puckeditor/core";

/**
 * Row — flex container holding `Column` blocks.
 *
 * Pairs with `Column.tsx`. Designed as a two-block model rather than a single
 * "row with N columns" block so each column can carry its own width, padding,
 * and alignment without the parent fighting back.
 *
 * Layout strategy:
 *   * Mobile (< md / 768px): always stacks vertically. Horizontal/vertical
 *     alignment props are scoped to `md:` breakpoints — on mobile the
 *     stacked columns fill width with a uniform gap, which is what every
 *     marketing site does.
 *   * Desktop (>= md): becomes `flex-row`; gap, justify, items classes apply.
 *
 * The `columns` slot constrains drops to `Column` only. Editors can't drop a
 * Hero into a Row directly — they have to go via a Column, which keeps the
 * grid math sane.
 */

export type RowProps = {
  gap: "none" | "sm" | "md" | "lg" | "xl";
  horizontalAlignment:
    | "start"
    | "center"
    | "end"
    | "between"
    | "around"
    | "evenly";
  verticalAlignment: "top" | "center" | "bottom" | "stretch";
  height: "auto" | "sm" | "md" | "lg" | "full" | "custom";
  /** Free-form CSS value used when `height === "custom"`. Accepts any valid
   *  CSS length: `400px`, `60vh`, `50%`, etc. Applied as `min-height` so
   *  content overflow doesn't get clipped. */
  customHeight: string;
  columns: Slot;
};

const GAP_CLASS: Record<RowProps["gap"], string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-8",
  xl: "gap-12",
};

// `md:` prefix because below md the layout is `flex-col` and these classes
// control the cross-axis there — confusing for editors. Forcing them to apply
// only at md+ keeps mobile behaviour predictable (stacked, full-width, gap).
const H_JUSTIFY_CLASS: Record<RowProps["horizontalAlignment"], string> = {
  start: "md:justify-start",
  center: "md:justify-center",
  end: "md:justify-end",
  between: "md:justify-between",
  around: "md:justify-around",
  evenly: "md:justify-evenly",
};

const V_ALIGN_CLASS: Record<RowProps["verticalAlignment"], string> = {
  top: "md:items-start",
  center: "md:items-center",
  bottom: "md:items-end",
  stretch: "md:items-stretch",
};

// Height presets. Applied as `min-height` (not `height`) so a row whose
// content is taller than the preset still grows naturally — a fixed
// `height` would either clip or force a scrollbar, which is rarely what
// editors want. `full` is `min-h-screen` (matches HeroFlex's "Full screen"
// option). `custom` is escape-hatch territory for editors who need a
// specific value.
const HEIGHT_CLASS: Record<Exclude<RowProps["height"], "custom">, string> = {
  auto: "",
  sm: "md:min-h-[200px]",
  md: "md:min-h-[320px]",
  lg: "md:min-h-[480px]",
  full: "md:min-h-screen",
};

export const RowConfig: ComponentConfig<RowProps> = {
  label: "Row",
  fields: {
    gap: {
      type: "select",
      label: "Gap between columns",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra large", value: "xl" },
      ],
    },
    horizontalAlignment: {
      type: "select",
      label: "Horizontal alignment",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
        { label: "Space between", value: "between" },
        { label: "Space around", value: "around" },
        { label: "Space evenly", value: "evenly" },
      ],
    },
    verticalAlignment: {
      type: "select",
      label: "Vertical alignment",
      options: [
        { label: "Top", value: "top" },
        { label: "Center", value: "center" },
        { label: "Bottom", value: "bottom" },
        { label: "Stretch (equal heights)", value: "stretch" },
      ],
    },
    height: {
      type: "select",
      label: "Row height (desktop)",
      options: [
        { label: "Auto (fits content)", value: "auto" },
        { label: "Small (~200px)", value: "sm" },
        { label: "Medium (~320px)", value: "md" },
        { label: "Large (~480px)", value: "lg" },
        { label: "Full screen", value: "full" },
        { label: "Custom\u2026", value: "custom" },
      ],
    },
    customHeight: {
      type: "text",
      label: "Custom height (CSS, e.g. 60vh or 480px)",
    },
    columns: {
      type: "slot",
      allow: ["Column"],
    },
  },
  defaultProps: {
    gap: "md",
    horizontalAlignment: "start",
    verticalAlignment: "stretch",
    height: "auto",
    customHeight: "",
    // Empty default — editor drops in Columns. Pre-seeding two Columns would
    // need IDs, and Puck assigns those at insert time, so we leave it empty
    // and let the editor populate.
    columns: [],
  },
  render: ({
    gap,
    horizontalAlignment,
    verticalAlignment,
    height,
    customHeight,
    columns: Columns,
  }) => {
    // Height: preset → Tailwind class; "custom" → inline min-height. Custom
    // wins when a value is supplied; an empty custom value falls back to no
    // height enforcement (effectively "auto") so the row doesn't disappear.
    // Scoped to `md:` so the height only applies on desktop — on mobile the
    // row stacks vertically and a forced height would create awkward
    // whitespace under each stacked column.
    const heightClass = height === "custom" ? "" : HEIGHT_CLASS[height] ?? "";
    const heightStyle =
      height === "custom" && customHeight
        ? { minHeight: customHeight }
        : undefined;

    const className = [
      "flex flex-col w-full md:flex-row",
      GAP_CLASS[gap] ?? GAP_CLASS.md,
      H_JUSTIFY_CLASS[horizontalAlignment] ?? H_JUSTIFY_CLASS.start,
      V_ALIGN_CLASS[verticalAlignment] ?? V_ALIGN_CLASS.stretch,
      heightClass,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Columns
        as="div"
        className={className}
        style={heightStyle}
        // Visible drop target before any columns are added — otherwise a
        // freshly-inserted Row collapses to 0 height and editors can't drop
        // into it.
        minEmptyHeight={120}
      />
    );
  },
};
