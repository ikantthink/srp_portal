import type { ComponentConfig } from "@puckeditor/core";

export type VideoEmbedProps = {
  url: string;
  aspectRatio: "16:9" | "4:3" | "1:1";
};

export const VideoEmbedConfig: ComponentConfig<VideoEmbedProps> = {
  fields: {
    url: { type: "text" },
    aspectRatio: {
      type: "radio",
      options: [
        { label: "16:9", value: "16:9" },
        { label: "4:3", value: "4:3" },
        { label: "1:1", value: "1:1" },
      ],
    },
  },
  defaultProps: { url: "", aspectRatio: "16:9" },
  render: ({ url, aspectRatio }) => {
    const ratioClass = aspectRatio === "4:3" ? "aspect-[4/3]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-video";
    let embedUrl = url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return (
      <div className="px-6 py-12 max-w-4xl mx-auto">
        <div className={`${ratioClass} w-full overflow-hidden rounded-lg bg-muted`}>
          {embedUrl ? (
            <iframe src={embedUrl} className="h-full w-full" allowFullScreen />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Enter a video URL
            </div>
          )}
        </div>
      </div>
    );
  },
};
