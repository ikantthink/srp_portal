"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/portal/media/media-picker";
import { ImagePlus } from "lucide-react";

// ---------------------------------------------------------------------------
// Single URL renderer
// ---------------------------------------------------------------------------
export function MediaUrlFieldRender({
  id,
  value,
  onChange,
  readOnly,
  accept,
  placeholder,
  folderSlug,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  accept: "image" | "video" | "any";
  placeholder: string;
  folderSlug?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder={placeholder}
          className="flex-1 h-9 min-w-0 rounded border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={readOnly}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded border border-border bg-background px-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
          title="Browse Media library"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Browse
        </button>
      </div>
      {value && accept === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="mt-1 h-16 rounded border bg-muted/30 object-cover"
        />
      )}
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={(urls) => urls[0] && onChange(urls[0])}
        accept={accept}
        initialFolderSlug={folderSlug}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Newline-joined list renderer
// ---------------------------------------------------------------------------
export function MediaUrlListFieldRender({
  id,
  value,
  onChange,
  readOnly,
  accept,
  folderSlug,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  accept: "image" | "video" | "any";
  folderSlug?: string;
}) {
  const [open, setOpen] = useState(false);

  const urls = value.split("\n").filter(Boolean);

  function append(picked: string[]) {
    if (picked.length === 0) return;
    // De-dupe so a user picking the same file twice doesn't create duplicate
    // grid entries.
    const merged = Array.from(new Set([...urls, ...picked]));
    onChange(merged.join("\n"));
  }

  return (
    <div className="space-y-1">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        rows={Math.max(3, Math.min(8, urls.length + 1))}
        placeholder="One URL per line"
        className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {urls.length} image{urls.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={readOnly}
          className="inline-flex h-8 items-center gap-1 rounded border border-border bg-background px-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Browse Media
        </button>
      </div>
      {urls.length > 0 && accept === "image" && (
        <div className="mt-1 flex flex-wrap gap-1">
          {urls.slice(0, 8).map((u, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={u}
              alt=""
              className="h-10 w-10 rounded border bg-muted/30 object-cover"
            />
          ))}
          {urls.length > 8 && (
            <span className="text-[11px] text-muted-foreground self-end">
              +{urls.length - 8}
            </span>
          )}
        </div>
      )}
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={append}
        multi
        accept={accept}
        initialFolderSlug={folderSlug}
      />
    </div>
  );
}
