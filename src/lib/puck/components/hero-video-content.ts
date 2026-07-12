/**
 * HeroVideo content migration helpers.
 *
 * HeroVideo originally stored copy in four fixed fields (heading, subheading,
 * ctaText, ctaLink). It now uses a single WYSIWYG `content` HTML string — the
 * same editor HeroFlex uses. To avoid losing text on already-published pages,
 * we migrate the legacy fields into equivalent HTML: on load in the editor
 * (via `resolveData`, so the WYSIWYG shows the old copy) and at render time as
 * a backstop for blocks that were never re-opened/saved (the public renderer
 * doesn't run `resolveData`).
 */

export type HeroVideoLegacyFields = {
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build WYSIWYG-compatible HTML from the legacy fixed HeroVideo fields. */
export function heroVideoLegacyHtml(props: HeroVideoLegacyFields): string {
  const parts: string[] = [];
  const heading = props.heading?.trim();
  const subheading = props.subheading?.trim();
  const ctaText = props.ctaText?.trim();
  if (heading) parts.push(`<h1>${escapeHtml(heading)}</h1>`);
  if (subheading) parts.push(`<p>${escapeHtml(subheading)}</p>`);
  if (ctaText) {
    // Empty/missing link falls back to "#" so the anchor is still valid.
    const href = props.ctaLink?.trim() || "#";
    parts.push(`<p><a href="${escapeHtml(href)}">${escapeHtml(ctaText)}</a></p>`);
  }
  return parts.join("");
}

/**
 * The HTML to render: prefer the WYSIWYG `content`, otherwise fall back to a
 * migration of the legacy fields. Returns "" when nothing is set.
 */
export function heroVideoContentHtml(
  props: HeroVideoLegacyFields & { content?: string },
): string {
  return props.content?.trim() ? props.content : heroVideoLegacyHtml(props);
}
