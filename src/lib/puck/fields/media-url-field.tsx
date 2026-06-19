import type { CustomField } from "@puckeditor/core";
import {
  MediaUrlFieldRender,
  MediaUrlListFieldRender,
} from "./media-url-field-renderers";

// NOTE: this module intentionally has NO `"use client"` directive. The
// factory functions below are called at module-evaluation time from the
// component configs (e.g. Hero.tsx), and those configs end up imported by
// server modules (the `generate-page` server action loader pulls in
// `puck/config` which imports every component). If this file were a client
// module, the server would only see a client *reference* and crash with
// "Attempted to call mediaUrlField() from the server" the first time
// anything triggered the page editor's actions bundle.
//
// The interactive renderers live in `./media-url-field-renderers` which
// keeps the `"use client"` boundary scoped to the actual React UI. The
// render closures below capture those client components and Puck invokes
// them client-side inside the editor.

/**
 * Builds a Puck custom field whose value is a single URL (or empty string).
 * Renders a text input plus a "Browse Media" button that opens the
 * MediaPicker. Picking a file writes its public URL into the field.
 *
 * `accept` constrains which file types the picker shows. The text input
 * remains free-form so editors can still paste external URLs (e.g. an
 * IDX photo) when they want to.
 */
export function mediaUrlField({
  accept = "any",
  placeholder = "https://...",
  folderSlug,
}: {
  accept?: "image" | "video" | "any";
  placeholder?: string;
  folderSlug?: string;
} = {}): CustomField<string> {
  return {
    type: "custom",
    render: ({ value, onChange, id, readOnly }) => {
      return (
        <MediaUrlFieldRender
          id={id}
          value={value ?? ""}
          onChange={onChange}
          readOnly={readOnly}
          accept={accept}
          placeholder={placeholder}
          folderSlug={folderSlug}
        />
      );
    },
  };
}

/**
 * Same idea but holds a newline-joined list of URLs. Convenient for fields
 * like ImageGallery.images which is a textarea of URLs today.
 */
export function mediaUrlListField({
  accept = "image",
  folderSlug,
}: {
  accept?: "image" | "video" | "any";
  folderSlug?: string;
} = {}): CustomField<string> {
  return {
    type: "custom",
    render: ({ value, onChange, id, readOnly }) => {
      return (
        <MediaUrlListFieldRender
          id={id}
          value={value ?? ""}
          onChange={onChange}
          readOnly={readOnly}
          accept={accept}
          folderSlug={folderSlug}
        />
      );
    },
  };
}
