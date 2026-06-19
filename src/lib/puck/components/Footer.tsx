import type { CSSProperties } from "react";
import { resolveNavColor } from "./nav-variant";
import { getPlatformIcon } from "@/lib/social/platform-icons";
import { stripDangerousTags } from "../fields/sanitize-html";

/**
 * `FooterTextBlock.body` used to be plain text rendered with `whitespace-pre-line`.
 * It was upgraded to sanitised HTML (so editors can insert `mailto:` / `tel:`
 * links etc. via the WYSIWYG field). This helper bridges the two formats:
 *   - If `value` already contains HTML tags, return it untouched.
 *   - Otherwise, treat it as legacy plain text — HTML-escape it, split on
 *     blank lines into paragraphs, and convert single newlines into `<br>`.
 *
 * Idempotent: once a block has been edited and saved as HTML, this becomes a
 * no-op pass-through, so existing data keeps rendering the same and new data
 * skips the conversion.
 */
export function legacyTextToHtml(value: string): string {
  if (!value) return "";
  if (/<\/?[a-z][\s\S]*?>/i.test(value)) return value;
  const escape = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      c === "&" ? "&amp;" :
      c === "<" ? "&lt;" :
      c === ">" ? "&gt;" :
      c === '"' ? "&quot;" :
      "&#39;"
    );
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escape(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export type FooterBlockAlign = "left" | "center" | "right";

interface FooterBlockBase {
  id: string;
  align: FooterBlockAlign;
}

export interface FooterLinkListBlock extends FooterBlockBase {
  type: "linkList";
  title: string;
  links: string;
}

export interface FooterImageBlock extends FooterBlockBase {
  type: "image";
  src: string;
  alt: string;
  // 0 = unbounded; the renderer still caps width at 100% of the column so
  // these are *additional* upper bounds the editor sets per asset.
  maxWidth: number;
  maxHeight: number;
}

export interface FooterImageLinkBlock extends FooterBlockBase {
  type: "imageLink";
  src: string;
  alt: string;
  href: string;
  maxWidth: number;
  maxHeight: number;
}

export interface FooterTextBlock extends FooterBlockBase {
  type: "text";
  heading: string;
  body: string;
  /** Body font size in px. Defaults to 14 (matching the original `text-sm`).
   * The heading uses its own larger size that scales relative to this. */
  fontSize: number;
  /** Text color. Empty string = inherit the footer's text color. Otherwise
   * accepts the same `theme:<token>` sentinels or raw CSS colors as the
   * appearance section, resolved via `resolveNavColor`. */
  color: string;
}

export interface FooterCopyrightBlock extends FooterBlockBase {
  type: "copyright";
  /** Supports `{year}` substitution. */
  text: string;
}

export interface FooterSocialBlock extends FooterBlockBase {
  type: "social";
  /** Same `Label|url` per-line format as the legacy `socialLinks` field. */
  links: string;
}

export type FooterInlineRowVerticalAlign = "top" | "center" | "bottom" | "stretch";

/**
 * A horizontal container of other blocks rendered side-by-side. Useful for
 * "a row of logos / images inside one column". Children are normal blocks
 * minus another inline row — nesting is restricted to one level to keep the
 * editor and renderer tractable.
 */
export interface FooterInlineRowBlock extends FooterBlockBase {
  type: "inlineRow";
  /** Inline-row children may be any block type except another `inlineRow`. */
  children: FooterLeafBlock[];
  /** Gap (px) between children inside the inline row. */
  gap: number;
  /** Whether children wrap to a new line when they overflow the column width. */
  wrap: boolean;
  /** Cross-axis alignment of children when their natural heights differ
   * (e.g. a tall image next to a short logo). Maps to flex `align-items`. */
  verticalAlign: FooterInlineRowVerticalAlign;
}

/** Block types allowed as direct children inside an inline row (no nesting). */
export type FooterLeafBlock =
  | FooterLinkListBlock
  | FooterImageBlock
  | FooterImageLinkBlock
  | FooterTextBlock
  | FooterCopyrightBlock
  | FooterSocialBlock;

export type FooterBlock = FooterLeafBlock | FooterInlineRowBlock;

export type FooterBlockType = FooterBlock["type"];
export type FooterLeafBlockType = FooterLeafBlock["type"];

export type FooterStyle = {
  /** Gap between columns within a row. */
  columnGap: number;
  /** Gap between stacked blocks within a single column. */
  rowGap: number;
  /** Gap between rows. */
  rowSpacing: number;
  verticalPadding: number;
  horizontalPadding: number;
  linkSpacing: number;
};

export type FooterRow = {
  id: string;
  /** Outer = visual columns (left → right). Inner = blocks stacked
   * top-to-bottom within that column. An empty column is `[]`. */
  columns: FooterBlock[][];
  /** Proportional fr-weights for each column, parallel to `columns`. A
   * uniform `[1, 1, 1]` row keeps the existing equal-width layout. Setting
   * one entry to `2` makes that column take twice the space of a `1`.
   *
   * Stored as a parallel array (rather than embedded in each column entry)
   * to keep the column model JSON-back-compat with the original
   * `FooterBlock[][]` shape — the normalizer pads/trims this on load so
   * mismatched lengths never reach the renderer. */
  columnWeights: number[];
  /** When true (default) columns wrap to a new visual line once they can't
   * fit their `FOOTER_COLUMN_MIN_WIDTH_PX` minimum side-by-side. Disable to
   * force a strict single-row grid that just shrinks each column instead. */
  wrap: boolean;
};

/** Default weight for a single column. Kept here (not inline) so the
 * editor, factory, and normalizer all agree on the same "neutral" value. */
export const FOOTER_COLUMN_WEIGHT_DEFAULT = 1;

/** Per-column minimum width before wrapping kicks in (when `row.wrap` is on).
 * Roughly matches the editor's `minmax(220px, 1fr)` column threshold so the
 * preview and live render share the same wrap point. Capped with `min(…,
 * 100%)` at render time so it never overflows a sub-220px container. */
export const FOOTER_COLUMN_MIN_WIDTH_PX = 220;

export type FooterProps = {
  rows: FooterRow[];
  /** All four color fields accept a `theme:<token>` sentinel (resolved to a
   * CSS variable reference) or a raw CSS color string. Matches the navbar's
   * color system so a single brand theme change flows through both. */
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  linkHoverColor: string;
  style: FooterStyle;
  /** Optional CSS `max-width` applied to the inner content container so the
   * footer aligns with the surrounding site chrome. Threaded down from the
   * active nav variant by the public layout — when absent we fall back to a
   * sensible cap so direct callers (tests, preview, etc.) keep working. */
  containerMaxWidth?: string;
};

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseLink(line: string): { label: string; href: string } | null {
  const [label, href] = line.split("|").map((s) => s?.trim());
  if (!label || !href) return null;
  return { label, href };
}

export const FOOTER_STYLE_DEFAULTS: FooterStyle = {
  columnGap: 32,
  rowGap: 24,
  rowSpacing: 32,
  verticalPadding: 48,
  horizontalPadding: 24,
  linkSpacing: 6,
};

function makeId(prefix: string, seed: string): string {
  if (seed) return seed;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeBlockId(seed: string): string {
  return makeId("block", seed);
}

export function makeRowId(seed = ""): string {
  return makeId("row", seed);
}

export function makeLinkListBlock(
  init: Partial<Omit<FooterLinkListBlock, "type">> = {}
): FooterLinkListBlock {
  return {
    id: makeBlockId(init.id ?? ""),
    type: "linkList",
    align: init.align ?? "left",
    title: init.title ?? "Column",
    links: init.links ?? "",
  };
}

export function makeImageBlock(
  init: Partial<Omit<FooterImageBlock, "type">> = {}
): FooterImageBlock {
  return {
    id: makeBlockId(init.id ?? ""),
    type: "image",
    align: init.align ?? "left",
    src: init.src ?? "",
    alt: init.alt ?? "",
    maxWidth: init.maxWidth ?? 0,
    maxHeight: init.maxHeight ?? 0,
  };
}

export function makeImageLinkBlock(
  init: Partial<Omit<FooterImageLinkBlock, "type">> = {}
): FooterImageLinkBlock {
  return {
    id: makeBlockId(init.id ?? ""),
    type: "imageLink",
    align: init.align ?? "left",
    src: init.src ?? "",
    alt: init.alt ?? "",
    href: init.href ?? "",
    maxWidth: init.maxWidth ?? 0,
    maxHeight: init.maxHeight ?? 0,
  };
}

export function makeTextBlock(
  init: Partial<Omit<FooterTextBlock, "type">> = {}
): FooterTextBlock {
  return {
    id: makeBlockId(init.id ?? ""),
    type: "text",
    align: init.align ?? "left",
    heading: init.heading ?? "",
    body: init.body ?? "",
    fontSize: typeof init.fontSize === "number" && init.fontSize > 0 ? init.fontSize : 14,
    color: init.color ?? "",
  };
}

export function makeCopyrightBlock(
  init: Partial<Omit<FooterCopyrightBlock, "type">> = {}
): FooterCopyrightBlock {
  return {
    id: makeBlockId(init.id ?? ""),
    type: "copyright",
    align: init.align ?? "left",
    text: init.text ?? "© {year} All rights reserved.",
  };
}

export function makeSocialBlock(
  init: Partial<Omit<FooterSocialBlock, "type">> = {}
): FooterSocialBlock {
  return {
    id: makeBlockId(init.id ?? ""),
    type: "social",
    align: init.align ?? "left",
    links: init.links ?? "",
  };
}

export function makeInlineRowBlock(
  init: Partial<Omit<FooterInlineRowBlock, "type">> = {}
): FooterInlineRowBlock {
  // Cast to the wider FooterBlock so the nested-row guard isn't optimized
  // away by the compiler. The static type already excludes inlineRow but a
  // JS caller (or a stale persisted payload) could still slip one in, and
  // silently dropping is friendlier than crashing the editor.
  const rawChildren = (init.children ?? []) as FooterBlock[];
  const children = rawChildren.filter(
    (c): c is FooterLeafBlock => !!c && c.type !== "inlineRow"
  );
  return {
    id: makeBlockId(init.id ?? ""),
    type: "inlineRow",
    align: init.align ?? "left",
    children,
    gap: typeof init.gap === "number" && init.gap >= 0 ? init.gap : 16,
    wrap: init.wrap ?? true,
    verticalAlign: init.verticalAlign ?? "top",
  };
}

export function makeFooterBlock(
  type: FooterBlockType,
  init: Partial<FooterBlock> = {}
): FooterBlock {
  switch (type) {
    case "image":
      return makeImageBlock(init as Partial<FooterImageBlock>);
    case "imageLink":
      return makeImageLinkBlock(init as Partial<FooterImageLinkBlock>);
    case "text":
      return makeTextBlock(init as Partial<FooterTextBlock>);
    case "copyright":
      return makeCopyrightBlock(init as Partial<FooterCopyrightBlock>);
    case "social":
      return makeSocialBlock(init as Partial<FooterSocialBlock>);
    case "inlineRow":
      return makeInlineRowBlock(init as Partial<FooterInlineRowBlock>);
    case "linkList":
    default:
      return makeLinkListBlock(init as Partial<FooterLinkListBlock>);
  }
}

/** Like `makeFooterBlock` but refuses to produce an inline row, so callers
 * that build inline-row children can't accidentally create nested rows. */
export function makeFooterLeafBlock(
  type: FooterLeafBlockType,
  init: Partial<FooterLeafBlock> = {}
): FooterLeafBlock {
  return makeFooterBlock(type, init) as FooterLeafBlock;
}

export function makeFooterRow(
  init: Partial<FooterRow> = {}
): FooterRow {
  const columns = init.columns ?? [[]];
  // If the caller passed explicit weights, trust the length they sent (the
  // normalizer reconciles mismatches on disk-load; here we assume the caller
  // knows what they're doing). Otherwise produce a uniform array that
  // matches the column count.
  const columnWeights = init.columnWeights
    ? init.columnWeights.slice()
    : columns.map(() => FOOTER_COLUMN_WEIGHT_DEFAULT);
  return {
    id: makeRowId(init.id ?? ""),
    columns,
    columnWeights,
    wrap: init.wrap ?? true,
  };
}

export const FOOTER_DEFAULTS: FooterProps = {
  rows: [
    {
      id: "row_default_links",
      columns: [
        [
          makeLinkListBlock({
            id: "block_default_explore",
            title: "Explore",
            links: "Listings|/listings\nNeighborhoods|/neighborhoods\nBlog|/blog",
          }),
        ],
        [
          makeLinkListBlock({
            id: "block_default_company",
            title: "Company",
            links: "About|/about\nContact|/contact\nAgent Login|/login",
          }),
        ],
      ],
      columnWeights: [1, 1],
      wrap: true,
    },
    {
      id: "row_default_meta",
      columns: [
        [
          makeCopyrightBlock({
            id: "block_default_copy",
            text: "© {year} SRP Real Estate. All rights reserved.",
          }),
        ],
        [
          makeSocialBlock({
            id: "block_default_social",
            align: "right",
            links: "facebook|https://facebook.com\ninstagram|https://instagram.com",
          }),
        ],
      ],
      columnWeights: [1, 1],
      wrap: true,
    },
  ],
  backgroundColor: "theme:foreground",
  textColor: "#ffffff",
  linkColor: "rgba(255,255,255,0.7)",
  linkHoverColor: "#ffffff",
  style: FOOTER_STYLE_DEFAULTS,
};

const ALIGN_CLASS: Record<FooterBlockAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const ALIGN_FLEX: Record<FooterBlockAlign, string> = {
  left: "items-start",
  center: "items-center",
  right: "items-end",
};

export function FooterView({
  rows,
  backgroundColor,
  textColor,
  linkColor,
  linkHoverColor,
  style,
  containerMaxWidth,
}: FooterProps) {
  // Expose link colors as CSS variables on the footer so block renderers
  // (and any nested `<a>`) inherit them via arbitrary-value Tailwind
  // classes without prop-drilling. Resolving with `resolveNavColor` lets
  // `theme:<token>` sentinels become `var(--…)` references.
  const footerStyle: CSSProperties = {
    backgroundColor: resolveNavColor(backgroundColor),
    color: resolveNavColor(textColor),
    paddingTop: style.verticalPadding,
    paddingBottom: style.verticalPadding,
    paddingLeft: style.horizontalPadding,
    paddingRight: style.horizontalPadding,
    ["--footer-link" as string]: resolveNavColor(linkColor),
    ["--footer-link-hover" as string]: resolveNavColor(linkHoverColor),
  };

  const nonEmptyRows = rows.filter((r) => r.columns.length > 0);

  // Default cap kept at `max-w-6xl` (1152px) so legacy callers that don't
  // pass `containerMaxWidth` (tests, the Puck preview, direct mounts) render
  // identically to before this prop existed. When the public layout supplies
  // a value derived from the active nav variant, it overrides the cap so the
  // footer's content container aligns with the navbar.
  const containerStyle: CSSProperties = { rowGap: style.rowSpacing };
  if (containerMaxWidth) containerStyle.maxWidth = containerMaxWidth;

  return (
    <footer style={footerStyle}>
      <div
        className={`mx-auto flex flex-col ${containerMaxWidth ? "w-full" : "max-w-6xl"}`}
        style={containerStyle}
      >
        {nonEmptyRows.map((row) => (
          <FooterRowView
            key={row.id}
            row={row}
            columnGap={style.columnGap}
            rowGap={style.rowGap}
            linkSpacing={style.linkSpacing}
          />
        ))}
      </div>
    </footer>
  );
}

function FooterRowView({
  row,
  columnGap,
  rowGap,
  linkSpacing,
}: {
  row: FooterRow;
  columnGap: number;
  rowGap: number;
  linkSpacing: number;
}) {
  // Reconcile weights with the actual column count defensively. The
  // normalizer already does this on load, but FooterView accepts raw props
  // from places that bypass normalization (e.g. tests, direct callers).
  // Falling back to `1fr` per column matches the legacy equal-width grid.
  const columnCount = Math.max(row.columns.length, 1);
  const weights = Array.from(
    { length: columnCount },
    (_, i) => sanitizeWeight(row.columnWeights?.[i])
  );

  // Wrap-mode layout: flexbox with `flex-wrap: wrap`. Each column gets
  // `flex: <weight> 1 0` so weight ratios apply when there's room, plus a
  // `min-width` floor that triggers wrapping once columns can't sit
  // side-by-side without falling below it. We can't use CSS Grid here —
  // `auto-fit minmax(MIN, 1fr)` would wrap but throw out per-column
  // weights, making the new width control silently no-op after a wrap.
  // The `min(MINpx, 100%)` cap prevents the floor from overflowing very
  // narrow containers (e.g. a 200px mobile viewport with a 220px floor).
  if (row.wrap !== false) {
    const minWidth = `min(${FOOTER_COLUMN_MIN_WIDTH_PX}px, 100%)`;
    return (
      <div className="flex flex-wrap" style={{ columnGap, rowGap }}>
        {row.columns.map((columnBlocks, ci) => (
          <div
            key={ci}
            className="flex flex-col"
            style={{
              flex: `${weights[ci]} 1 0`,
              minWidth,
              rowGap,
            }}
          >
            {columnBlocks.map((block) => (
              <FooterBlockView
                key={block.id}
                block={block}
                linkSpacing={linkSpacing}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Strict single-row grid — columns shrink (down to their content's
  // intrinsic minimum) instead of wrapping. Preserved as the explicit
  // opt-out for users who specifically want side-by-side layout at every
  // viewport size, even when that means cramped columns.
  const gridTemplateColumns = weights
    .map((w) => `minmax(0, ${w}fr)`)
    .join(" ");
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns,
        columnGap,
        rowGap,
      }}
    >
      {row.columns.map((columnBlocks, ci) => (
        <div key={ci} className="flex flex-col" style={{ rowGap }}>
          {columnBlocks.map((block) => (
            <FooterBlockView
              key={block.id}
              block={block}
              linkSpacing={linkSpacing}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Coerce any incoming weight value into a positive finite number, falling
 * back to the neutral default. Centralized so the renderer, normalizer, and
 * editor (when adjusting weights) all reject the same garbage values. */
export function sanitizeWeight(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return FOOTER_COLUMN_WEIGHT_DEFAULT;
  }
  return value;
}

function FooterBlockView({
  block,
  linkSpacing,
}: {
  block: FooterBlock;
  linkSpacing: number;
}) {
  const align = ALIGN_CLASS[block.align];
  const flexAlign = ALIGN_FLEX[block.align];

  if (block.type === "linkList") {
    const links = parseLines(block.links)
      .map(parseLink)
      .filter((x): x is { label: string; href: string } => x !== null);
    return (
      <div className={`space-y-2 ${align}`}>
        {block.title && (
          <p className="text-sm font-semibold uppercase tracking-wide">
            {block.title}
          </p>
        )}
        <ul className="flex flex-col" style={{ rowGap: linkSpacing }}>
          {links.map((l, li) => (
            <li key={li}>
              <FooterLink href={l.href}>{l.label}</FooterLink>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (block.type === "image") {
    if (!block.src) return null;
    return (
      <div className={align}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.src} alt={block.alt} style={imageStyle(block)} />
      </div>
    );
  }

  if (block.type === "imageLink") {
    if (!block.src) return null;
    const href = block.href || "#";
    const isInternal = href.startsWith("/");
    return (
      <div className={align}>
        <a
          href={href}
          {...(isInternal ? {} : { target: "_blank", rel: "noreferrer" })}
          className="inline-block transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt} style={imageStyle(block)} />
        </a>
      </div>
    );
  }

  if (block.type === "text") {
    if (!block.heading && !block.body) return null;
    // Color empty → inherit the footer's text color (no inline style applied,
    // so the parent's color cascades through). Heading scales 1.25x the body
    // size so the visual hierarchy stays roughly consistent whatever the user
    // picks for body fontSize.
    const textColor = block.color ? resolveNavColor(block.color) : undefined;
    const headingSize = Math.max(12, Math.round(block.fontSize * 1.25));
    // Body is sanitised HTML produced by the WYSIWYG field. Legacy blocks
    // (plain text saved before the WYSIWYG upgrade) are upgraded on the fly
    // by `legacyTextToHtml` so they still render with line breaks intact.
    const safeBody = block.body
      ? stripDangerousTags(legacyTextToHtml(block.body))
      : "";
    return (
      <div className={`footer-text-block space-y-2 ${align}`}>
        {block.heading && (
          <p
            className="font-bold uppercase tracking-wide"
            style={{ fontSize: headingSize, color: textColor }}
          >
            {block.heading}
          </p>
        )}
        {safeBody && (
          <div
            className="footer-text-body"
            style={{ fontSize: block.fontSize, color: textColor }}
            dangerouslySetInnerHTML={{ __html: safeBody }}
          />
        )}
        {/* Scoped typography for the WYSIWYG output. `a` picks up the footer's
            link color variables so editor-inserted `mailto:` / `tel:` links
            still match the rest of the footer without extra config. */}
        <style>{`
          .footer-text-body :first-child { margin-top: 0; }
          .footer-text-body :last-child  { margin-bottom: 0; }
          .footer-text-body p { margin: 0 0 0.5rem; line-height: 1.5; }
          .footer-text-body ul,
          .footer-text-body ol { margin: 0 0 0.5rem; padding-left: 1.25rem; }
          .footer-text-body li { margin: 0.125rem 0; }
          .footer-text-body a {
            color: var(--footer-link);
            text-decoration: underline;
            transition: color 150ms;
          }
          .footer-text-body a:hover { color: var(--footer-link-hover); }
          .footer-text-body h1,
          .footer-text-body h2,
          .footer-text-body h3,
          .footer-text-body h4,
          .footer-text-body h5,
          .footer-text-body h6 { font-weight: 700; margin: 0.5rem 0 0.25rem; line-height: 1.2; }
        `}</style>
      </div>
    );
  }

  if (block.type === "copyright") {
    const rendered = block.text.replace("{year}", String(new Date().getFullYear()));
    return (
      <p className={`text-xs opacity-80 ${align}`}>{rendered}</p>
    );
  }

  if (block.type === "inlineRow") {
    if (block.children.length === 0) return null;
    // We honor the block's align via flex justify so the row of children sits
    // at the requested edge of its column. `flex-1` per child would
    // distribute, but here we want natural-width items grouped together.
    const justify =
      block.align === "center"
        ? "justify-center"
        : block.align === "right"
          ? "justify-end"
          : "justify-start";
    const items =
      block.verticalAlign === "center"
        ? "items-center"
        : block.verticalAlign === "bottom"
          ? "items-end"
          : block.verticalAlign === "stretch"
            ? "items-stretch"
            : "items-start";
    return (
      <div
        className={`flex ${items} ${block.wrap ? "flex-wrap" : ""} ${justify}`}
        style={{ gap: block.gap }}
      >
        {block.children.map((child) => (
          <FooterBlockView key={child.id} block={child} linkSpacing={linkSpacing} />
        ))}
      </div>
    );
  }

  // social — icon-based. The `label` portion of each `Label|url` line is the
  // platform key used to look up the icon (case-insensitive) and doubles as
  // the link's accessible name so screen readers still announce it.
  const links = parseLines(block.links)
    .map(parseLink)
    .filter((x): x is { label: string; href: string } => x !== null);
  if (links.length === 0) return null;
  return (
    <div className={`flex ${flexAlign}`}>
      <ul className="flex flex-wrap items-center gap-3">
        {links.map((s, i) => {
          const Icon = getPlatformIcon(s.label);
          return (
            <li key={i}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                title={s.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors [color:var(--footer-link)] hover:[color:var(--footer-link-hover)]"
              >
                <Icon className="h-5 w-5" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Renders an anchor that picks up the footer's link color via CSS variables
 * the `<footer>` sets on itself. Tailwind arbitrary-value `hover:` lets the
 * hover color come from the variable too without any client-side JS.
 */
function FooterLink({
  href,
  children,
  external = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}) {
  const isExternal = external || /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`text-sm transition-colors [color:var(--footer-link)] hover:[color:var(--footer-link-hover)] ${className}`}
    >
      {children}
    </a>
  );
}

/**
 * Compute inline style for an image/imageLink block. Always keeps a `100%`
 * column-overflow safety net; layers user-specified max-width on top via
 * `min(Xpx, 100%)` so a 1000px cap on a 200px column still shrinks. When a
 * max-height is set, the browser scales width to preserve aspect ratio.
 */
function imageStyle(block: {
  maxWidth: number;
  maxHeight: number;
}): CSSProperties {
  const style: CSSProperties = {
    display: "inline-block",
    maxWidth: block.maxWidth > 0 ? `min(${block.maxWidth}px, 100%)` : "100%",
  };
  if (block.maxHeight > 0) {
    style.maxHeight = block.maxHeight;
    style.width = "auto";
    style.height = "auto";
  }
  return style;
}
