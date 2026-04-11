import type { ComponentConfig } from "@puckeditor/core";

export type TextBlockProps = {
  content: string;
  alignment: "left" | "center" | "right";
};

export const TextBlockConfig: ComponentConfig<TextBlockProps> = {
  fields: {
    content: { type: "textarea" },
    alignment: {
      type: "radio",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  },
  defaultProps: {
    content: "Add your content here. This supports plain text with line breaks.",
    alignment: "left",
  },
  render: ({ content, alignment }) => (
    <div className="px-6 py-12 max-w-4xl mx-auto" style={{ textAlign: alignment }}>
      <div className="prose prose-lg max-w-none whitespace-pre-wrap">
        {content}
      </div>
    </div>
  ),
};
