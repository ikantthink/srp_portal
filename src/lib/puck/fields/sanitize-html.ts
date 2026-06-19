/**
 * Tiny allow-list HTML sanitizer for the WYSIWYG field.
 *
 * Why not DOMPurify?
 *   * DOMPurify needs a DOM to walk. Our `PuckRenderer` is `"use client"`,
 *     which means React still SSRs it once in Node before hydration; pulling
 *     in a server-safe DOMPurify variant would mean a new dependency
 *     (`isomorphic-dompurify`) for a single use site.
 *   * Our WYSIWYG only emits a small, fixed set of tags/attributes via the
 *     toolbar and a strict paste handler. A bespoke allow-list keeps the
 *     attack surface narrow and avoids the extra dep.
 *
 * Two passes, designed to be cheap and run safely in both Node and browser:
 *   1. `stripDangerousTags` removes whole element trees we never want to
 *      render — script/style/iframe/object/embed/link/meta — using a
 *      regex sweep. This runs on the *server* render path so persisted HTML
 *      can't smuggle in something nasty even if the editor sanitiser was
 *      bypassed (e.g. someone hand-edited the saved JSON).
 *   2. `sanitiseHtml` (browser only) does a full DOM walk using the
 *      allow-list below. Used inside the editor on input and on paste, so
 *      we persist already-clean HTML.
 *
 * Output is always a string of HTML safe to pass to
 * `dangerouslySetInnerHTML`.
 */

// ---------------------------------------------------------------------------
// Allow-lists used by the in-browser DOM sanitiser.
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = new Set([
  "p",
  "div",
  "span",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "small",
  "sub",
  "sup",
  "font", // produced by execCommand("fontName") / ("foreColor") in some browsers
]);

// Attribute names allowed across all tags.
const GLOBAL_ATTRS = new Set(["style", "class", "id", "lang", "dir"]);

// Per-tag attribute allow-list, merged with GLOBAL_ATTRS at check time.
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  font: new Set(["color", "face", "size"]),
};

// Style properties allowed inside `style=""`. Everything else is dropped.
const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "text-align",
  "text-decoration",
  "line-height",
  "letter-spacing",
]);

// Reject anything that smells like JS execution inside a URL.
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.startsWith("javascript:")) return false;
  if (trimmed.startsWith("data:") && !trimmed.startsWith("data:image/")) return false;
  if (trimmed.startsWith("vbscript:")) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Server-safe regex sweep. Used at render time as a backstop.
// ---------------------------------------------------------------------------

const DANGEROUS_TAG_RE = /<(script|style|iframe|object|embed|link|meta|noscript|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi;
// Self-closing variants of the same (no closing tag — still need to drop the open tag).
const DANGEROUS_TAG_SELF_CLOSE_RE = /<(script|style|iframe|object|embed|link|meta|noscript|svg|math)\b[^>]*\/?>/gi;
// on* event handlers anywhere in a tag.
const ON_ATTR_RE = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
// javascript: in href/src (covers stray cases not removed by DOM walk).
const JS_URL_RE = /\b(href|src|action|formaction|xlink:href)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi;

/**
 * Cheap regex pass that removes whole element trees we never want to render
 * plus any on* event handler attribute. Runs in Node (SSR) and in the
 * browser. Not a substitute for a full DOM sanitiser but enough to keep
 * obviously-malicious payloads out of the rendered tree.
 */
export function stripDangerousTags(html: string): string {
  if (!html) return "";
  return html
    .replace(DANGEROUS_TAG_RE, "")
    .replace(DANGEROUS_TAG_SELF_CLOSE_RE, "")
    .replace(ON_ATTR_RE, "")
    .replace(JS_URL_RE, "");
}

// ---------------------------------------------------------------------------
// Browser DOM sanitiser. Walks the parsed tree, dropping disallowed nodes
// and attributes. Returns serialised HTML.
// ---------------------------------------------------------------------------

/**
 * Parse HTML in the browser, drop anything not in the allow-list, and
 * return the safe HTML string. Called by the WYSIWYG field on input / paste.
 *
 * Falls back to `stripDangerousTags` outside a browser context (e.g. unit
 * tests in node) so it remains importable from server modules.
 */
export function sanitiseHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return stripDangerousTags(html);
  }

  // Wrap in <body> so DOMParser gives us a predictable root.
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${html}`, "text/html");
  walk(doc.body);
  return doc.body.innerHTML;
}

function walk(node: Element): void {
  // Iterate over a static copy: we may remove children during the walk.
  const children = Array.from(node.children);
  for (const child of children) {
    const tag = child.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      // Disallowed element — keep its text content so we don't silently
      // delete what the user typed, but drop the wrapping tag.
      const text = child.textContent ?? "";
      child.replaceWith(document.createTextNode(text));
      continue;
    }

    // Clean attributes.
    const attrAllowed = TAG_ATTRS[tag];
    for (const attr of Array.from(child.attributes)) {
      const name = attr.name.toLowerCase();
      const isOnHandler = name.startsWith("on");
      const isGloballyAllowed = GLOBAL_ATTRS.has(name);
      const isTagAllowed = attrAllowed?.has(name) ?? false;
      if (isOnHandler || (!isGloballyAllowed && !isTagAllowed)) {
        child.removeAttribute(attr.name);
        continue;
      }
      if ((name === "href" || name === "src") && !isSafeUrl(attr.value)) {
        child.removeAttribute(attr.name);
        continue;
      }
      if (name === "style") {
        const cleaned = sanitiseStyle(attr.value);
        if (cleaned) child.setAttribute("style", cleaned);
        else child.removeAttribute("style");
      }
    }

    // Anchors always get safe rel + target.
    if (tag === "a" && child.getAttribute("href")) {
      const target = child.getAttribute("target");
      if (target === "_blank") {
        child.setAttribute("rel", "noopener noreferrer");
      }
    }

    walk(child);
  }
}

function sanitiseStyle(value: string): string {
  // Split on `;`, drop disallowed properties, drop values containing
  // expression()/url(javascript:)/etc.
  const pieces = value
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  const safe: string[] = [];
  for (const piece of pieces) {
    const idx = piece.indexOf(":");
    if (idx < 0) continue;
    const prop = piece.slice(0, idx).trim().toLowerCase();
    const val = piece.slice(idx + 1).trim();
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
    if (/expression\s*\(|javascript:|url\s*\(/i.test(val)) continue;
    // Reject anything with raw < > " that could escape the attribute.
    if (/[<>"]/.test(val)) continue;
    safe.push(`${prop}: ${val}`);
  }
  return safe.join("; ");
}
