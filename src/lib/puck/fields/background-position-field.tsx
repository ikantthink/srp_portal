import type { CustomField } from "@puckeditor/core";
import { BackgroundPositionFieldRender } from "./background-position-field-renderer";

// See media-url-field.tsx — factory stays server-safe; renderer is client.

export function backgroundPositionField(): CustomField<number> {
  return {
    type: "custom",
    render: ({ value, onChange, id, readOnly }) => (
      <BackgroundPositionFieldRender
        id={id}
        value={value ?? 50}
        onChange={onChange}
        readOnly={readOnly}
      />
    ),
  };
}
