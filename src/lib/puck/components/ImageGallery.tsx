"use client";

import { useId } from "react";
import type { ComponentConfig } from "@puckeditor/core";
import { mediaUrlListField } from "../fields/media-url-field";

export type ImageGalleryProps = {
  images: string;
  columns: number;
};

export const ImageGalleryConfig: ComponentConfig<ImageGalleryProps> = {
  fields: {
    images: mediaUrlListField({ accept: "image", folderSlug: "website" }),
    columns: { type: "number" },
  },
  defaultProps: {
    images: "",
    columns: 3,
  },
  render: ({ images, columns }) => {
    return <Gallery images={images} columns={columns} />;
  },
};

function Gallery({ images, columns }: ImageGalleryProps) {
  const urls = images.split("\n").filter(Boolean);
  // Always stack to 1-up on phones and 2-up on small tablets, regardless of
  // the configured column count, so photos don't get crushed below readable width.
  const desktopCols = Math.max(2, Math.min(columns || 2, 6));
  // useId keeps the responsive override scoped to this gallery instance even
  // when multiple galleries with different column counts coexist on a page.
  const rawId = useId();
  const cls = `gallery-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div className="px-4 py-12 max-w-6xl mx-auto sm:px-6">
      {urls.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center text-muted-foreground">
          Add image URLs (one per line)
        </div>
      ) : (
        <>
          <style>{`
            @media (min-width: 768px) {
              .${cls} { grid-template-columns: repeat(${desktopCols}, minmax(0, 1fr)); }
            }
          `}</style>
          <div className={`${cls} grid grid-cols-1 gap-4 sm:grid-cols-2`}>
            {urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="aspect-video w-full rounded-lg object-cover"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
