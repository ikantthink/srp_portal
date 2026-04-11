import type { ComponentConfig } from "@puckeditor/core";

export type FormEmbedProps = {
  formSlug: string;
  heading: string;
};

export const FormEmbedConfig: ComponentConfig<FormEmbedProps> = {
  fields: {
    formSlug: { type: "text" },
    heading: { type: "text" },
  },
  defaultProps: { formSlug: "", heading: "" },
  render: ({ formSlug, heading, puck }) => {
    const isEditing = puck?.isEditing;
    return (
      <section className="px-6 py-12 max-w-2xl mx-auto">
        {heading && <h2 className="text-2xl font-bold text-center mb-6">{heading}</h2>}
        {isEditing ? (
          <div className="rounded-lg border-2 border-dashed border-brand-primary/30 p-8 text-center">
            <p className="text-sm font-medium text-brand-primary">Form Embed</p>
            <p className="text-xs text-muted-foreground mt-1">
              Slug: {formSlug || "(none set)"}
            </p>
          </div>
        ) : formSlug ? (
          <iframe
            src={`/f/${formSlug}?embed=true`}
            className="w-full min-h-[400px] rounded-lg border-0"
          />
        ) : (
          <p className="text-center text-muted-foreground">No form configured.</p>
        )}
      </section>
    );
  },
};
