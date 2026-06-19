import type { CustomField } from "@puckeditor/core";
import { WysiwygFieldRender } from "./wysiwyg-field-renderer";

// See media-url-field.tsx for the rationale: this factory file is
// intentionally NOT `"use client"`. It's imported by component configs
// (e.g. HeroFlex.tsx) which the server-side `generate-page` loader pulls in,
// so making this a client module would surface as "Attempted to call
// wysiwygField() from the server".
//
// The interactive editor UI lives in `./wysiwyg-field-renderer` which keeps
// the `"use client"` boundary scoped to React state and DOM access.

export interface WysiwygFieldOptions {
  /** Minimum height for the editable area (CSS height). */
  minHeight?: string;
  /** Optional placeholder shown when the field is empty. */
  placeholder?: string;
}

/**
 * Puck custom field that edits a single HTML string via a small WYSIWYG
 * toolbar. The stored value is sanitised HTML — safe to pass straight to
 * `dangerouslySetInnerHTML` on the render side (see `sanitize-html.ts`).
 */
export function wysiwygField(opts: WysiwygFieldOptions = {}): CustomField<string> {
  return {
    type: "custom",
    render: ({ value, onChange, id, readOnly }) => (
      <WysiwygFieldRender
        id={id}
        value={value ?? ""}
        onChange={onChange}
        readOnly={readOnly}
        minHeight={opts.minHeight}
        placeholder={opts.placeholder}
      />
    ),
  };
}
