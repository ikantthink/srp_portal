"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Folder,
  Loader2,
  Search,
  X,
  Image as ImageIcon,
  FileText,
  Film,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listFiles, listFolders, listTags } from "@/actions/media";
import { getBrandAssets, type BrandAsset } from "@/actions/brand";
import {
  isImageMime,
  isPdfMime,
  isVideoMime,
  fileDisplayName,
} from "./media-utils";
import { TagPicker } from "./tag-picker";
import type { MediaFile, MediaFolder, MediaTag } from "@/types/database";

/** Sentinel folder id for the brand-logos pseudo-folder. */
const BRAND_FOLDER_ID = "__brand__";

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (urls: string[]) => void;
  multi?: boolean;
  /** Filter the picker to a single mime category. Useful when a field only
   *  makes sense for images. */
  accept?: "image" | "video" | "any";
  initialFolderSlug?: string;
}

export function MediaPicker(props: MediaPickerProps) {
  // Gate the inner component so its effect only ever fires once, on mount.
  // The React Compiler discourages setState-inside-effect; this avoids it
  // entirely while still resetting state cleanly each time the picker opens.
  if (!props.open) return null;
  return <MediaPickerInner {...props} />;
}

function MediaPickerInner({
  onClose,
  onPick,
  multi = false,
  accept = "any",
  initialFolderSlug,
}: MediaPickerProps) {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [tags, setTags] = useState<MediaTag[]>([]);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const [folderId, setFolderId] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<Set<string>>(new Set());

  // Brand assets are only meaningful for image-accepting pickers — they're
  // all image URLs and would be irrelevant for, say, a video-only field.
  const showBrandSection = accept !== "video" && brandAssets.length > 0;

  useEffect(() => {
    let alive = true;
    Promise.all([listFolders(), listFiles(), listTags(), getBrandAssets()]).then(
      ([fl, fi, tg, ba]) => {
        if (!alive) return;
        setFolders(fl);
        setFiles(fi);
        setTags(tg);
        setBrandAssets(ba);
        if (initialFolderSlug) {
          const target = fl.find((f) => f.slug === initialFolderSlug);
          if (target) setFolderId(target.id);
        }
        setLoading(false);
      }
    );
    return () => {
      alive = false;
    };
  }, [initialFolderSlug]);

  const inBrandSection = folderId === BRAND_FOLDER_ID;

  const visibleFiles = useMemo(() => {
    if (inBrandSection) return [];
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      if (accept === "image" && !isImageMime(f.mime_type)) return false;
      if (accept === "video" && !isVideoMime(f.mime_type)) return false;
      if (folderId !== "all" && f.folder_id !== folderId) return false;
      if (q) {
        const haystack = `${f.filename} ${f.display_name ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (tagFilter.size > 0) {
        const ids = new Set((f.tags ?? []).map((t) => t.id));
        for (const t of tagFilter) if (!ids.has(t)) return false;
      }
      return true;
    });
  }, [files, folderId, search, tagFilter, accept, inBrandSection]);

  const visibleBrandAssets = useMemo(() => {
    if (!inBrandSection) return [];
    const q = search.trim().toLowerCase();
    if (!q) return brandAssets;
    return brandAssets.filter((a) => a.label.toLowerCase().includes(q));
  }, [brandAssets, inBrandSection, search]);

  function pickUrl(url: string) {
    if (!multi) {
      setPicked(new Set([url]));
      return;
    }
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function togglePick(file: MediaFile) {
    if (!file.public_url) return;
    pickUrl(file.public_url);
  }

  function commit() {
    onPick(Array.from(picked));
    onClose();
  }

  // Portal to `document.body` so the modal escapes any parent stacking context
  // (notably Puck's editor root, which uses transform/contain and otherwise
  // traps the modal beneath the page sidebar regardless of inner z-index).
  // z-[100] is well above the sidebar (z-30) and leaves room above for
  // top-of-the-world UI like toasts.
  //
  // No SSR/mount gate needed: the outer `MediaPicker` wrapper returns null
  // until `open=true`, and every caller initialises `open` to false in
  // useState, so `MediaPickerInner` only ever renders after a user click —
  // i.e. always client-side, with `document.body` guaranteed to exist.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">
            {multi ? "Select files from Media" : "Select a file from Media"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Folder rail */}
          <aside className="w-44 shrink-0 overflow-y-auto border-r p-2">
            <FolderButton
              label="All files"
              active={folderId === "all"}
              onClick={() => setFolderId("all")}
            />
            {folders.map((f) => (
              <FolderButton
                key={f.id}
                label={f.name}
                active={folderId === f.id}
                onClick={() => setFolderId(f.id)}
              />
            ))}
            {showBrandSection && (
              <>
                <div className="my-2 border-t" />
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Branding
                </p>
                <FolderButton
                  label="Brand logos"
                  icon={<Palette className="h-3.5 w-3.5" />}
                  active={inBrandSection}
                  onClick={() => setFolderId(BRAND_FOLDER_ID)}
                />
              </>
            )}
          </aside>

          {/* Main */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search media..."
                  className="h-9 pl-9"
                />
              </div>
              {!inBrandSection && (
                <TagPicker
                  tags={tags}
                  selectedIds={tagFilter}
                  onToggle={(tag) => {
                    setTagFilter((prev) => {
                      const next = new Set(prev);
                      if (next.has(tag.id)) next.delete(tag.id);
                      else next.add(tag.id);
                      return next;
                    });
                  }}
                  triggerLabel="Tag"
                  allowCreate={false}
                />
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : inBrandSection ? (
                visibleBrandAssets.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    {brandAssets.length === 0 ? (
                      <>
                        No brand logos configured. Upload some at{" "}
                        <a
                          href="/portal/settings/branding"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-primary underline"
                        >
                          Settings → Branding
                        </a>
                        .
                      </>
                    ) : (
                      <>No brand logos match your search.</>
                    )}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                    {visibleBrandAssets.map((asset) => (
                      <BrandAssetTile
                        key={asset.key}
                        asset={asset}
                        selected={picked.has(asset.url)}
                        onClick={() => pickUrl(asset.url)}
                      />
                    ))}
                  </div>
                )
              ) : visibleFiles.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No matching files. Upload some at{" "}
                  <a
                    href="/portal/media"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary underline"
                  >
                    /portal/media
                  </a>
                  .
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {visibleFiles.map((file) => (
                    <PickerTile
                      key={file.id}
                      file={file}
                      selected={!!file.public_url && picked.has(file.public_url)}
                      onClick={() => togglePick(file)}
                    />
                  ))}
                </div>
              )}
            </div>

            <footer className="flex items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                {picked.size > 0
                  ? `${picked.size} selected`
                  : multi
                    ? "Click tiles to select"
                    : "Click a tile to select"}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={commit}
                  disabled={picked.size === 0}
                >
                  Use{multi ? ` ${picked.size}` : ""}
                </Button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FolderButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {icon ?? <Folder className="h-3.5 w-3.5" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

function BrandAssetTile({
  asset,
  selected,
  onClick,
}: {
  asset: BrandAsset;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={asset.label}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg border bg-muted/40 transition-all",
        selected
          ? "border-brand-primary ring-2 ring-brand-primary/40"
          : "border-border hover:border-foreground/40"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.url}
        alt=""
        loading="lazy"
        // Brand logos are typically transparent; `object-contain` plus the
        // checker-ish muted background prevents wide/tall logos from being
        // cropped square and makes alpha edges visible.
        className="h-full w-full object-contain p-2"
      />
      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 text-[10px] text-white">
        {asset.label}
      </span>
    </button>
  );
}

function PickerTile({
  file,
  selected,
  onClick,
}: {
  file: MediaFile;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={fileDisplayName(file)}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg border bg-muted/40 transition-all",
        selected
          ? "border-brand-primary ring-2 ring-brand-primary/40"
          : "border-border hover:border-foreground/40"
      )}
    >
      {isImageMime(file.mime_type) && file.public_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.public_url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : isVideoMime(file.mime_type) && file.public_url ? (
        <div className="relative h-full w-full">
          <video
            src={`${file.public_url}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/50 p-1.5 backdrop-blur-sm">
              <Film className="h-3.5 w-3.5 text-white" />
            </span>
          </span>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {isPdfMime(file.mime_type) ? (
            <FileText className="h-8 w-8 text-muted-foreground" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      )}
      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 text-[10px] text-white">
        {fileDisplayName(file)}
      </span>
    </button>
  );
}
