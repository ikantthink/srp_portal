import type { CustomField } from "@puckeditor/core";
import { ColorFieldRender } from "./color-field-renderer";

// See media-url-field.tsx / wysiwyg-field.tsx for why this factory is not
// `"use client"`: component configs that import it get pulled in by server
// modules during page generation.

export interface ColorFieldOptions {
  /** Default value used when the saved value is empty. */
  fallback?: string;
}

/**
 * Puck custom field that edits a single CSS color. Renders a native
 * `<input type="color">` plus a text input so editors can paste a hex
 * directly or pick visually. Stored as a string ("#rrggbb" or any valid
 * CSS color); empty string means "no value".
 */
export function colorField(opts: ColorFieldOptions = {}): CustomField<string> {
  return {
    type: "custom",
    render: ({ value, onChange, id, readOnly }) => (
      <ColorFieldRender
        id={id}
        value={value ?? ""}
        onChange={onChange}
        readOnly={readOnly}
        fallback={opts.fallback ?? "#000000"}
      />
    ),
  };
}
