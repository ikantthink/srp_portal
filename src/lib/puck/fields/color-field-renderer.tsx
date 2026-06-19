"use client";

import { useEffect, useState } from "react";

/**
 * Color picker + hex text input pair.
 *
 * The native `<input type="color">` always emits a normalised `#rrggbb`
 * value, but editors often want to paste a brand hex or named colour. We
 * therefore store the raw text value and only forward it to the color
 * input if it parses as a 6-digit hex (the only format the native control
 * understands).
 */
export function ColorFieldRender({
  id,
  value,
  onChange,
  readOnly,
  fallback,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  fallback: string;
}) {
  // Local mirror so we can let the user type "#3b8" or "rgb(...)" without
  // the upstream onChange flickering every keystroke through a re-render.
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const hexForPicker = toHex(value) ?? toHex(fallback) ?? "#000000";

  return (
    <div className="flex items-center gap-1">
      <input
        type="color"
        aria-label="Pick color"
        value={hexForPicker}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
        disabled={readOnly}
        className="h-9 w-10 cursor-pointer rounded border border-border bg-background p-0.5 disabled:opacity-50"
      />
      <input
        id={id}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(text)}
        disabled={readOnly}
        placeholder="#000000"
        className="flex-1 h-9 min-w-0 rounded border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setText("");
            onChange("");
          }}
          disabled={readOnly}
          title="Clear color"
          className="inline-flex h-9 shrink-0 items-center rounded border border-border bg-background px-2 text-xs hover:bg-muted disabled:opacity-50"
        >
          Clear
        </button>
      )}
    </div>
  );
}

/**
 * Normalise a CSS color string to `#rrggbb` for the native picker. Returns
 * null for unsupported inputs (rgb(), named colors, etc.) — callers should
 * fall back to a default.
 */
function toHex(value: string): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    // Expand #rgb → #rrggbb so the native control accepts it.
    return (
      "#" +
      v
        .slice(1)
        .split("")
        .map((c) => c + c)
        .join("")
        .toLowerCase()
    );
  }
  return null;
}
