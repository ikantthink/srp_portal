// Layout fields shared across every block. Applied via `withLayoutFields`,
// which is what `src/lib/puck/config.ts` uses to wrap each component.
//
// Design notes:
//   * Spacing scale is fixed to Tailwind tokens so the editor stays out of
//     pixel-tweaking territory.
//   * `none` emits *no* padding/margin classes on the wrapper. Blocks already
//     ship with sensible internal padding (e.g. `px-4 py-12 sm:px-6 sm:py-16`
//     on TextBlock/CallToAction) — the wrapper's `none` value keeps that
//     default intact. Any other wrapper value adds extra padding *on top*,
//     because the wrapper is outside the block. That trade-off keeps existing
//     pages visually identical until someone deliberately picks a non-`none`
//     value.
//   * `maxWidth=full` is the no-op default; the smaller values just constrain
//     via `mx-auto max-w-*` so users can centre a wide hero inside the page.
//   * `background=custom` reveals an inline-style override field; everything
//     else maps to a Tailwind utility (brand variables or muted/foreground).

/* eslint-disable @typescript-eslint/no-explicit-any --
 * Puck's `ComponentConfig` generic uses tightly-typed conditional generics
 * that can't accept a plain `Record<string, unknown>`. The wrapper here
 * intentionally erases the component-specific props so it can be reused
 * across every block — the public API still returns a `ComponentConfig<any>`
 * which Puck consumes via the same loose-typed path.
 */

import type { CSSProperties } from "react";
import type { ComponentConfig, Fields } from "@puckeditor/core";

type AnyConfig = ComponentConfig<any>;

export type PaddingY = "none" | "sm" | "md" | "lg" | "xl";
export type PaddingX = "none" | "sm" | "md" | "lg";
export type MarginY = "none" | "sm" | "md" | "lg";
export type MaxWidth = "narrow" | "default" | "wide" | "full";
export type Background =
  | "none"
  | "muted"
  | "brand-primary"
  | "brand-secondary"
  | "brand-accent"
  | "custom";

export interface LayoutProps {
  paddingY: PaddingY;
  paddingX: PaddingX;
  marginY: MarginY;
  maxWidth: MaxWidth;
  background: Background;
  backgroundColor: string;
}

export const LAYOUT_DEFAULTS: LayoutProps = {
  paddingY: "none",
  paddingX: "none",
  marginY: "none",
  maxWidth: "full",
  background: "none",
  backgroundColor: "",
};

const PADDING_Y_CLASS: Record<PaddingY, string> = {
  none: "",
  sm: "py-4",
  md: "py-8",
  lg: "py-12",
  xl: "py-20",
};

const PADDING_X_CLASS: Record<PaddingX, string> = {
  none: "",
  sm: "px-4",
  md: "px-8",
  lg: "px-12",
};

const MARGIN_Y_CLASS: Record<MarginY, string> = {
  none: "",
  sm: "my-4",
  md: "my-8",
  lg: "my-12",
};

const MAX_WIDTH_CLASS: Record<MaxWidth, string> = {
  narrow: "mx-auto max-w-3xl",
  default: "mx-auto max-w-5xl",
  wide: "mx-auto max-w-7xl",
  full: "",
};

const BACKGROUND_CLASS: Record<Exclude<Background, "custom" | "none">, string> = {
  muted: "bg-muted",
  "brand-primary": "bg-brand-primary text-white",
  "brand-secondary": "bg-brand-secondary text-white",
  "brand-accent": "bg-brand-accent text-black",
};

// Puck `Fields` shape. Exported so opting-into the layout fields elsewhere
// (e.g. a future custom block) reuses the exact same UI.
export const LAYOUT_FIELDS: Fields<LayoutProps> = {
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
  maxWidth: {
    type: "select",
    label: "Max width",
    options: [
      { label: "Full width", value: "full" },
      { label: "Wide", value: "wide" },
      { label: "Default", value: "default" },
      { label: "Narrow", value: "narrow" },
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
      { label: "Custom color…", value: "custom" },
    ],
  },
  backgroundColor: {
    type: "text",
    label: "Custom background (CSS color)",
  },
} as Fields<LayoutProps>;

/**
 * Tailwind class string for the wrapper.
 */
export function layoutClasses(props: Partial<LayoutProps>): string {
  const {
    paddingY = "none",
    paddingX = "none",
    marginY = "none",
    maxWidth = "full",
    background = "none",
  } = props;

  const parts = [
    PADDING_Y_CLASS[paddingY],
    PADDING_X_CLASS[paddingX],
    MARGIN_Y_CLASS[marginY],
    MAX_WIDTH_CLASS[maxWidth],
  ];

  if (background !== "none" && background !== "custom") {
    parts.push(BACKGROUND_CLASS[background]);
  }

  return parts.filter(Boolean).join(" ");
}

/**
 * Inline style — only set when `background === "custom"` and a colour is
 * provided. Returning `undefined` keeps React happy about omitted styles.
 */
export function layoutStyle(props: Partial<LayoutProps>): CSSProperties | undefined {
  if (props.background === "custom" && props.backgroundColor) {
    return { backgroundColor: props.backgroundColor };
  }
  return undefined;
}

/**
 * Wrap a `ComponentConfig` so that every instance gets the layout fields,
 * sensible defaults, and a wrapping `<div>` carrying the resolved Tailwind
 * classes (and optional custom background colour).
 *
 * Opt-outs: pure layout primitives (`Spacer`, `Divider`) and the now-removed
 * site-chrome blocks (`MainNav`, `Footer`) skip this mixin — they are not
 * content blocks and the wrapper would distort their behaviour.
 */
export function withLayoutFields(config: AnyConfig): AnyConfig {
  const originalRender = config.render;
  const wrapped: AnyConfig = {
    ...config,
    fields: {
      ...((config.fields ?? {}) as Fields<any>),
      ...LAYOUT_FIELDS,
    } as Fields<any>,
    defaultProps: {
      ...(config.defaultProps as Record<string, unknown>),
      ...LAYOUT_DEFAULTS,
    } as any,
    render: (props: any) => {
      const {
        paddingY,
        paddingX,
        marginY,
        maxWidth,
        background,
        backgroundColor,
        ...rest
      } = props;

      const layout = { paddingY, paddingX, marginY, maxWidth, background, backgroundColor };
      const className = layoutClasses(layout);
      const style = layoutStyle(layout);

      const innerNode = originalRender(rest);

      // No wrapper when every layout option is at its default — keeps the
      // rendered DOM identical for pages that haven't touched these fields.
      if (!className && !style) return <>{innerNode}</>;
      return (
        <div className={className || undefined} style={style}>
          {innerNode}
        </div>
      );
    },
  };
  return wrapped;
}
