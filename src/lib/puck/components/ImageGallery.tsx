import type { ComponentConfig } from "@puckeditor/core";

export type ImageGalleryProps = {
  images: string;
  columns: number;
};

export const ImageGalleryConfig: ComponentConfig<ImageGalleryProps> = {
  fields: {
    images: { type: "textarea" },
    columns: { type: "number" },
  },
  defaultProps: {
    images: "",
    columns: 3,
  },
  render: ({ images, columns }) => {
    const urls = images.split("\n").filter(Boolean);
    return (
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {urls.length === 0 ? (
            <div className="col-span-full rounded-lg border-2 border-dashed border-border p-12 text-center text-muted-foreground">
              Add image URLs (one per line)
            </div>
          ) : (
            urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="aspect-video w-full rounded-lg object-cover"
              />
            ))
          )}
        </div>
      </div>
    );
  },
};
