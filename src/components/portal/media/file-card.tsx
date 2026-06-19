"use client";

import { FileText, Film, FileQuestion, Image as ImageIcon, Copy, Check } from "lucide-react";
import { useState } from "react";
import { isImageMime, isPdfMime, isVideoMime, fileDisplayName, formatBytes } from "./media-utils";
import { cn } from "@/lib/utils";
import type { MediaFile } from "@/types/database";

interface FileCardProps {
  file: MediaFile;
  selected: boolean;
  onToggleSelected: () => void;
  onClick?: () => void;
}

export function FileCard({ file, selected, onToggleSelected, onClick }: FileCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyUrl(e: React.MouseEvent) {
    e.stopPropagation();
    if (!file.public_url) return;
    await navigator.clipboard.writeText(file.public_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all",
        selected
          ? "border-brand-primary ring-2 ring-brand-primary/40"
          : "border-border hover:border-foreground/30"
      )}
    >
      <label
        onClick={(e) => e.stopPropagation()}
        className="absolute left-2 top-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded border border-border bg-background/90 backdrop-blur"
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelected}
          className="h-3.5 w-3.5 accent-brand-primary cursor-pointer"
        />
      </label>

      <button
        type="button"
        onClick={copyUrl}
        title="Copy public link"
        className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/90 text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-foreground group-hover:opacity-100"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-brand-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted/40">
        <Preview file={file} />
      </div>

      <div className="space-y-1 p-2">
        <p className="truncate text-sm font-medium" title={fileDisplayName(file)}>
          {fileDisplayName(file)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {formatBytes(file.size_bytes)}
        </p>
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {file.tags.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                style={{ background: t.color }}
              >
                {t.name}
              </span>
            ))}
            {file.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{file.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Preview({ file }: { file: MediaFile }) {
  if (isImageMime(file.mime_type) && file.public_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={file.public_url}
        alt={fileDisplayName(file)}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    );
  }
  if (isVideoMime(file.mime_type) && file.public_url) {
    return (
      <div className="relative h-full w-full">
        {/* Appending `#t=0.1` nudges the browser to render the first frame
            as a thumbnail in WebKit/Chromium without paying for autoplay. */}
        <video
          src={`${file.public_url}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/50 p-1.5 backdrop-blur-sm">
            <Film className="h-4 w-4 text-white" />
          </span>
        </span>
      </div>
    );
  }
  if (isVideoMime(file.mime_type)) {
    return <Film className="h-10 w-10 text-muted-foreground" />;
  }
  if (isPdfMime(file.mime_type)) {
    return <FileText className="h-10 w-10 text-muted-foreground" />;
  }
  return <FileQuestion className="h-10 w-10 text-muted-foreground" />;
}

export { ImageIcon };
