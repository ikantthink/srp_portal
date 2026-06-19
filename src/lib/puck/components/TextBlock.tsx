import type { ComponentConfig } from "@puckeditor/core";
import { wysiwygField } from "../fields/wysiwyg-field";
import { stripDangerousTags } from "../fields/sanitize-html";

export type TextBlockProps = {
  content: string;
  alignment: "left" | "center" | "right";
};

export const TextBlockConfig: ComponentConfig<TextBlockProps> = {
  fields: {
    content: {
      ...wysiwygField({
        minHeight: "200px",
        placeholder: "Add your content here. Use the toolbar to format text and insert links.",
      }),
      label: "Content",
    },
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
    content:
      "<p>Add your content here. Use the toolbar above to format text and insert links — including <a href=\"mailto:hello@example.com\">email</a> and <a href=\"tel:+15551234567\">phone</a> links.</p>",
    alignment: "left",
  },
  render: ({ content, alignment }) => {
    // Backstop sanitiser. The WYSIWYG field already sanitises on input/paste,
    // but the saved JSON could in principle be hand-edited — strip dangerous
    // tags / `on*` handlers / `javascript:` URLs on the render path too.
    const safeContent = stripDangerousTags(content || "");

    return (
      <div className="px-4 py-10 max-w-4xl mx-auto sm:px-6 sm:py-12" style={{ textAlign: alignment }}>
        <div
          className="text-block-content"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
        {/*
          Scoped typography defaults so the sanitised HTML renders sensibly
          without depending on @tailwindcss/typography (not installed). Mirrors
          the approach used by HeroFlex.
        */}
        <style>{`
          .text-block-content :first-child { margin-top: 0; }
          .text-block-content :last-child  { margin-bottom: 0; }
          .text-block-content h1 { font-size: 2rem;    font-weight: 700; line-height: 1.15; margin: 1rem 0 0.75rem; }
          .text-block-content h2 { font-size: 1.5rem;  font-weight: 700; line-height: 1.2;  margin: 1rem 0 0.5rem; }
          .text-block-content h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.25; margin: 0.875rem 0 0.5rem; }
          .text-block-content h4 { font-size: 1.125rem;font-weight: 600; margin: 0.75rem 0 0.5rem; }
          .text-block-content p  { font-size: 1rem; line-height: 1.6; margin: 0 0 1rem; }
          .text-block-content ul,
          .text-block-content ol { margin: 0 0 1rem; padding-left: 1.5rem; }
          .text-block-content li { margin: 0.25rem 0; }
          .text-block-content a  { color: var(--brand-primary, #2563eb); text-decoration: underline; }
          .text-block-content blockquote {
            border-left: 3px solid var(--border, #ccc);
            padding-left: 1rem;
            color: var(--muted-foreground, #555);
            margin: 0.5rem 0;
          }
          .text-block-content hr { border: 0; border-top: 1px solid var(--border, #e5e7eb); margin: 1.5rem 0; }
        `}</style>
      </div>
    );
  },
};
