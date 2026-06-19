"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  Link2Off,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RemoveFormatting,
} from "lucide-react";
import { sanitiseHtml } from "./sanitize-html";
import { FONT_OPTIONS, FONT_SIZE_OPTIONS } from "./font-options";

/**
 * WYSIWYG rich-text editor used by `wysiwygField()`.
 *
 * Implementation notes:
 *   * `contentEditable` + `execCommand` is the lightest way to ship a
 *     functional toolbar (bold/italic/heading/colour/etc.) without taking
 *     a 50 kB+ dep like TipTap. `execCommand` is officially deprecated but
 *     every evergreen browser still implements it as of 2026 and our
 *     surface area is tiny.
 *   * Paste is intercepted so we can sanitise pasted HTML before it lands
 *     in the editable area — otherwise users could smuggle in scripts/
 *     event handlers/iframes from copied web content.
 *   * The DOM is the source of truth while the user is typing. We only push
 *     the parent prop value back via `onChange` (sanitised) so the saved
 *     value is always safe to render.
 *   * The component reconciles external `value` updates (e.g. block switch
 *     in the Puck sidebar, or undo) by replacing `innerHTML` *only* when
 *     the incoming value differs from what the user is currently editing.
 *     Skipping the no-op write preserves cursor position during typing.
 */
export function WysiwygFieldRender({
  id,
  value,
  onChange,
  readOnly,
  minHeight = "180px",
  placeholder = "Start typing…",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  minHeight?: string;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  // Track the most-recent value we *emitted*, so we can detect when the
  // parent prop changed for an external reason (vs. our own onChange).
  //
  // Initialised to `null` (not to the incoming `value`) so the first effect
  // run always paints the initial HTML into the contentEditable — otherwise
  // the editor renders blank when the parent already has a default value.
  const lastEmittedRef = useRef<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState<string>("p");

  // Push the incoming value into the editable DOM only when it differs from
  // what we last emitted. This avoids stomping the user's caret during
  // their own typing.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value === lastEmittedRef.current) return;
    el.innerHTML = value;
    lastEmittedRef.current = value;
  }, [value]);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const clean = sanitiseHtml(el.innerHTML);
    lastEmittedRef.current = clean;
    onChange(clean);
  }, [onChange]);

  // Look at the selection's nearest block-level ancestor and reflect it in
  // the "Style" dropdown so the user can see what tag they're editing.
  // Declared *before* `runCommand` so the latter can call it without
  // tripping the no-use-before-define / react-hooks immutability rules.
  const syncCurrentBlock = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as Element).tagName.toLowerCase();
        if (["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "li"].includes(tag)) {
          setCurrentBlock(tag === "div" ? "p" : tag);
          return;
        }
      }
      node = node.parentNode;
    }
    setCurrentBlock("p");
  }, []);

  // execCommand needs the document to have focus on the editable element,
  // otherwise the command targets whatever Puck input the user just clicked.
  const runCommand = useCallback(
    (cmd: string, arg?: string) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      try {
        document.execCommand(cmd, false, arg);
      } catch {
        // execCommand can throw on some browser/extension combos; ignore
        // and let the user retry instead of crashing the editor UI.
      }
      emit();
      syncCurrentBlock();
    },
    [emit, syncCurrentBlock]
  );

  // Intercept paste so we sanitise HTML/text *before* it touches the DOM.
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const html = e.clipboardData.getData("text/html");
      const text = e.clipboardData.getData("text/plain");
      if (html) {
        const clean = sanitiseHtml(html);
        document.execCommand("insertHTML", false, clean);
      } else if (text) {
        // insertText handles newlines correctly and avoids any HTML.
        document.execCommand("insertText", false, text);
      }
      emit();
    },
    [emit]
  );

  // Prompt for a URL, then call execCommand("createLink"). We sanitise the
  // URL ourselves because some browsers happily create `javascript:` links.
  //
  // Convenience: if the user types a bare email or phone number, auto-prefix
  // `mailto:` / `tel:` so they don't have to remember the URL scheme. This is
  // the common case for "select text and make it a link" on contact info.
  const insertLink = useCallback(() => {
    const url = window.prompt(
      "Link URL (email and phone numbers are auto-detected — mailto:/tel:)",
      "https://"
    );
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed || trimmed === "https://") return;
    if (/^javascript:/i.test(trimmed)) return;
    runCommand("createLink", normaliseLinkUrl(trimmed));
  }, [runCommand]);

  const blockOptions = useMemo(
    () => [
      { label: "Paragraph", value: "p" },
      { label: "Heading 1", value: "h1" },
      { label: "Heading 2", value: "h2" },
      { label: "Heading 3", value: "h3" },
      { label: "Heading 4", value: "h4" },
      { label: "Heading 5", value: "h5" },
      { label: "Heading 6", value: "h6" },
      { label: "Blockquote", value: "blockquote" },
    ],
    []
  );

  const handleBlockChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const tag = e.target.value;
    // execCommand("formatBlock") expects the tag wrapped in angle brackets
    // in Firefox/Safari; Chrome accepts either.
    runCommand("formatBlock", `<${tag}>`);
  };

  const handleFontChange = (e: ChangeEvent<HTMLSelectElement>) => {
    runCommand("fontName", e.target.value);
  };

  const handleSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    if (!size) return;
    // execCommand("fontSize") only accepts 1-7. Apply via a styled <span>
    // by wrapping the selection ourselves using insertHTML.
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      // No selection — store the choice as a CSS variable on the editable
      // so future typing inherits it? Simpler: just ignore. Encourage
      // selecting text first.
      return;
    }
    const range = sel.getRangeAt(0);
    const frag = range.extractContents();
    const span = document.createElement("span");
    span.style.fontSize = size;
    span.appendChild(frag);
    range.insertNode(span);
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(span);
    sel.addRange(r);
    emit();
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    runCommand("foreColor", e.target.value);
  };

  const handleHighlightChange = (e: ChangeEvent<HTMLInputElement>) => {
    runCommand("hiliteColor", e.target.value);
  };

  const disabled = readOnly;

  return (
    <div className="space-y-1">
      <div
        className="flex flex-wrap items-center gap-1 rounded-t border border-border bg-muted/30 p-1"
        role="toolbar"
        aria-label="Text formatting"
      >
        <select
          aria-label="Text style"
          value={currentBlock}
          onChange={handleBlockChange}
          disabled={disabled}
          className="h-7 rounded border border-border bg-background px-1 text-xs"
        >
          {blockOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Font"
          defaultValue=""
          onChange={handleFontChange}
          disabled={disabled}
          className="h-7 rounded border border-border bg-background px-1 text-xs"
        >
          <option value="">Font</option>
          {FONT_OPTIONS.filter((f) => f.value).map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Font size"
          defaultValue=""
          onChange={handleSizeChange}
          disabled={disabled}
          className="h-7 rounded border border-border bg-background px-1 text-xs"
        >
          {FONT_SIZE_OPTIONS.map((s) => (
            <option key={s.value || "default"} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <ToolbarDivider />

        <ToolbarButton
          label="Bold"
          onClick={() => runCommand("bold")}
          disabled={disabled}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          onClick={() => runCommand("italic")}
          disabled={disabled}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          onClick={() => runCommand("underline")}
          disabled={disabled}
        >
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          onClick={() => runCommand("strikeThrough")}
          disabled={disabled}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <label
          className="inline-flex h-7 items-center gap-1 rounded border border-border bg-background px-1 text-xs"
          title="Text color"
        >
          <span aria-hidden="true">A</span>
          <input
            type="color"
            aria-label="Text color"
            onChange={handleColorChange}
            disabled={disabled}
            className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
        <label
          className="inline-flex h-7 items-center gap-1 rounded border border-border bg-background px-1 text-xs"
          title="Highlight color"
        >
          <span aria-hidden="true">H</span>
          <input
            type="color"
            aria-label="Highlight color"
            onChange={handleHighlightChange}
            disabled={disabled}
            className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>

        <ToolbarDivider />

        <ToolbarButton
          label="Align left"
          onClick={() => runCommand("justifyLeft")}
          disabled={disabled}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          onClick={() => runCommand("justifyCenter")}
          disabled={disabled}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          onClick={() => runCommand("justifyRight")}
          disabled={disabled}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton label="Insert link" onClick={insertLink} disabled={disabled}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Remove link"
          onClick={() => runCommand("unlink")}
          disabled={disabled}
        >
          <Link2Off className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Clear formatting"
          onClick={() => runCommand("removeFormat")}
          disabled={disabled}
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div
        id={id}
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={handlePaste}
        onKeyUp={syncCurrentBlock}
        onMouseUp={syncCurrentBlock}
        data-placeholder={placeholder}
        className="wysiwyg-editor w-full rounded-b border border-t-0 border-border bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        style={{ minHeight }}
      />

      {/*
        Inline style block for the placeholder + heading defaults. Scoped via
        the `.wysiwyg-editor` class so it doesn't bleed into the rendered
        page output. Kept inside the component so consumers don't have to
        wire anything up in their global CSS.
      */}
      <style>{`
        .wysiwyg-editor:empty::before {
          content: attr(data-placeholder);
          color: var(--muted-foreground, #888);
          pointer-events: none;
        }
        .wysiwyg-editor h1 { font-size: 1.875rem; font-weight: 700; margin: 0.25rem 0; }
        .wysiwyg-editor h2 { font-size: 1.5rem;   font-weight: 700; margin: 0.25rem 0; }
        .wysiwyg-editor h3 { font-size: 1.25rem;  font-weight: 600; margin: 0.25rem 0; }
        .wysiwyg-editor h4 { font-size: 1.125rem; font-weight: 600; margin: 0.25rem 0; }
        .wysiwyg-editor p  { margin: 0.25rem 0; }
        .wysiwyg-editor blockquote {
          border-left: 3px solid var(--border, #ccc);
          padding-left: 0.75rem;
          color: var(--muted-foreground, #555);
          margin: 0.5rem 0;
        }
        .wysiwyg-editor a { color: var(--brand-primary, #2563eb); text-decoration: underline; }
      `}</style>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  // mousedown handler with preventDefault keeps the selection inside the
  // editable area when the user clicks the toolbar button — otherwise the
  // selection moves to the button and execCommand has nothing to act on.
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 w-7 items-center justify-center rounded border border-transparent hover:border-border hover:bg-background disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />;
}

// Looks like an email address: anything@anything.tld with no spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Looks like a phone number: optional leading +, then digits, spaces, dashes,
// dots, parentheses. Require at least 7 digits to avoid matching things like
// version numbers.
const PHONE_RE = /^\+?[\d\s().\-]+$/;

/**
 * Take whatever the user typed into the "Link URL" prompt and turn it into a
 * usable href. Bare emails get `mailto:`, bare phone numbers get `tel:` (with
 * non-dialing characters stripped), and anything that already has a scheme is
 * left alone. URLs that look like domains without a scheme get `https://` so
 * the browser doesn't interpret them as relative paths.
 */
export function normaliseLinkUrl(input: string): string {
  const v = input.trim();
  if (!v) return v;

  // Already has a scheme (http:, https:, mailto:, tel:, ftp:, #anchor, /path).
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
  if (v.startsWith("#") || v.startsWith("/")) return v;

  if (EMAIL_RE.test(v)) return `mailto:${v}`;

  if (PHONE_RE.test(v)) {
    const digits = v.replace(/[^\d+]/g, "");
    // Require at least 7 digits (ignoring a leading +) — anything shorter is
    // probably not a phone number.
    const digitCount = digits.replace(/^\+/, "").length;
    if (digitCount >= 7) return `tel:${digits}`;
  }

  // Looks like a bare domain (e.g. "example.com/path") — prepend https.
  if (/^[\w-]+(\.[\w-]+)+/.test(v)) return `https://${v}`;

  return v;
}
