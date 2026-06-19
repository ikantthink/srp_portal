"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Folder,
  FolderLock,
  Trash2,
  FolderInput,
  TagIcon as TagIconLucide,
  X,
  Loader2,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NewFolderButton } from "./new-folder-button";
import { UploadDropzone } from "./upload-dropzone";
import { TagPicker } from "./tag-picker";
import { FileCard } from "./file-card";
import { fileDisplayName } from "./media-utils";
import {
  applyTagToFiles,
  clearTagsFromFiles,
  deleteFiles,
  deleteFolder,
  listFiles,
  moveFiles,
  removeTagFromFiles,
  renameFile,
  renameFolder,
} from "@/actions/media";
import type { MediaFile, MediaFolder, MediaTag } from "@/types/database";

interface MediaLibraryProps {
  initialFolders: MediaFolder[];
  initialFiles: MediaFile[];
  initialTags: MediaTag[];
}

export function MediaLibrary({
  initialFolders,
  initialFiles,
  initialTags,
}: MediaLibraryProps) {
  const [folders, setFolders] = useState<MediaFolder[]>(initialFolders);
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [tags, setTags] = useState<MediaTag[]>(initialTags);

  const [activeFolderId, setActiveFolderId] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [filterTagIds, setFilterTagIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === activeFolderId) ?? null,
    [folders, activeFolderId]
  );

  // Folder filter is applied client-side. Search and tag filters as well — we
  // already loaded the whole library on first render. For large libraries
  // we'd switch this to a server query, but the team-size scale here makes
  // a single round-trip simpler and faster than chasing per-keystroke
  // round-trips.
  const visibleFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      if (activeFolderId !== "all" && f.folder_id !== activeFolderId)
        return false;
      if (q) {
        const haystack = `${f.filename} ${f.display_name ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filterTagIds.size > 0) {
        const fileTagIds = new Set((f.tags ?? []).map((t) => t.id));
        for (const required of filterTagIds) {
          if (!fileTagIds.has(required)) return false;
        }
      }
      return true;
    });
  }, [files, activeFolderId, search, filterTagIds]);

  function refreshFiles() {
    // Pull a fresh snapshot after a mutation. We do this rather than mutating
    // local state piecemeal because most mutations are bulk and we want the
    // tag join to stay consistent.
    listFiles().then(setFiles);
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(visibleFiles.map((f) => f.id)));
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Delete ${selectedIds.size} file${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    const ids = Array.from(selectedIds);
    const result = await deleteFiles(ids);
    setBusy(false);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    setFiles((prev) => prev.filter((f) => !selectedIds.has(f.id)));
    clearSelection();
  }

  async function handleBulkMove(folderId: string) {
    if (selectedIds.size === 0) return;
    setBusy(true);
    const result = await moveFiles(Array.from(selectedIds), folderId);
    setBusy(false);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    setFiles((prev) =>
      prev.map((f) =>
        selectedIds.has(f.id) ? { ...f, folder_id: folderId } : f
      )
    );
    clearSelection();
  }

  async function handleBulkApplyTag(tag: MediaTag) {
    if (selectedIds.size === 0) return;
    setBusy(true);
    const result = await applyTagToFiles(tag.id, Array.from(selectedIds));
    setBusy(false);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    setFiles((prev) =>
      prev.map((f) => {
        if (!selectedIds.has(f.id)) return f;
        const existing = f.tags ?? [];
        if (existing.some((t) => t.id === tag.id)) return f;
        return { ...f, tags: [...existing, tag] };
      })
    );
  }

  async function handleBulkClearTags() {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Clear all tags from ${selectedIds.size} file${selectedIds.size === 1 ? "" : "s"}?`
      )
    ) {
      return;
    }
    setBusy(true);
    const result = await clearTagsFromFiles(Array.from(selectedIds));
    setBusy(false);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    setFiles((prev) =>
      prev.map((f) => (selectedIds.has(f.id) ? { ...f, tags: [] } : f))
    );
  }

  async function handleFolderRename(folder: MediaFolder, name: string) {
    const result = await renameFolder(folder.id, name);
    if ("error" in result) {
      alert(result.error);
      return false;
    }
    setFolders((prev) =>
      prev.map((f) => (f.id === folder.id ? { ...f, name } : f))
    );
    return true;
  }

  async function handleFolderDelete(folder: MediaFolder) {
    if (!confirm(`Delete folder "${folder.name}"?`)) return;
    const result = await deleteFolder(folder.id);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
    if (activeFolderId === folder.id) setActiveFolderId("all");
  }

  const openFile = openDetailsId
    ? files.find((f) => f.id === openDetailsId) ?? null
    : null;

  const totalCount = files.length;
  const visibleCount = visibleFiles.length;

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Folder rail */}
      <aside className="w-56 shrink-0 space-y-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setActiveFolderId("all")}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              activeFolderId === "all"
                ? "bg-muted font-semibold text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              All files
            </span>
            <span className="text-xs tabular-nums">{totalCount}</span>
          </button>

          {folders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              active={activeFolderId === folder.id}
              onSelect={() => setActiveFolderId(folder.id)}
              onRename={(name) => handleFolderRename(folder, name)}
              onDelete={() => handleFolderDelete(folder)}
            />
          ))}
        </div>

        <NewFolderButton
          onCreated={(folder) => {
            setFolders((prev) => [...prev, { ...folder, file_count: 0 }]);
            setActiveFolderId(folder.id);
          }}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Active-folder upload zone */}
        {activeFolder ? (
          <UploadDropzone
            folderId={activeFolder.id}
            folderSlug={activeFolder.slug}
            onUploaded={() => refreshFiles()}
          />
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Select a folder to upload files. Switch from <strong>All files</strong> to a specific folder, or create one in the rail.
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search files..."
            className="w-64"
          />
          <TagPicker
            tags={tags}
            selectedIds={filterTagIds}
            onToggle={(tag) => {
              setFilterTagIds((prev) => {
                const next = new Set(prev);
                if (next.has(tag.id)) next.delete(tag.id);
                else next.add(tag.id);
                return next;
              });
            }}
            onCreated={(tag) => setTags((prev) => [...prev, tag])}
            triggerLabel="Filter by tag"
            allowCreate={false}
          />
          {(filterTagIds.size > 0 || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterTagIds(new Set());
                setSearch("");
              }}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
          <p className="ml-auto text-xs text-muted-foreground">
            {visibleCount} of {totalCount} files
          </p>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={busy}
            >
              Clear
            </Button>
            <div className="mx-1 h-5 w-px bg-border" />

            <TagPicker
              tags={tags}
              selectedIds={new Set()}
              onToggle={handleBulkApplyTag}
              onCreated={(tag) => setTags((prev) => [...prev, tag])}
              triggerLabel="Apply tag"
              triggerIcon={<TagIconLucide className="h-3.5 w-3.5" />}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkClearTags}
              disabled={busy}
            >
              <X className="h-3.5 w-3.5" />
              Clear tags
            </Button>

            <MoveToFolderButton
              folders={folders}
              onMove={handleBulkMove}
              disabled={busy}
            />

            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllVisible}
              disabled={busy}
              className="ml-auto"
            >
              Select all visible
            </Button>
          </div>
        )}

        {/* Grid */}
        {visibleFiles.length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
            {totalCount === 0
              ? "No files yet. Upload one to get started."
              : "No files match your filters."}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visibleFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                selected={selectedIds.has(file.id)}
                onToggleSelected={() => toggleSelected(file.id)}
                onClick={() => setOpenDetailsId(file.id)}
              />
            ))}
          </div>
        )}
      </div>

      {openFile && (
        <FileDetailsDrawer
          file={openFile}
          folders={folders}
          tags={tags}
          onClose={() => setOpenDetailsId(null)}
          onChanged={refreshFiles}
          onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Folder row with inline rename + delete (system folders get a lock icon and
// cannot be renamed/deleted).
// ---------------------------------------------------------------------------
function FolderRow({
  folder,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  folder: MediaFolder;
  active: boolean;
  onSelect: () => void;
  onRename: (name: string) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    if (name.trim() === "" || name.trim() === folder.name) {
      setEditing(false);
      setName(folder.name);
      return;
    }
    const ok = await onRename(name.trim());
    if (ok) setEditing(false);
    else setName(folder.name);
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors",
        active
          ? "bg-muted font-semibold text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {folder.is_system ? (
        <FolderLock className="h-4 w-4 shrink-0" />
      ) : (
        <Folder className="h-4 w-4 shrink-0" />
      )}

      {editing ? (
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setEditing(false);
              setName(folder.name);
            }
          }}
          className="h-6 flex-1 px-1 py-0 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 truncate text-left text-sm"
        >
          {folder.name}
        </button>
      )}

      <span className="text-[11px] tabular-nums text-muted-foreground">
        {folder.file_count ?? 0}
      </span>

      {!folder.is_system && !editing && (
        <div className="flex opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="rounded p-0.5 hover:bg-background"
            title="Rename"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-0.5 hover:bg-background"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {editing && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
          className="rounded p-0.5 hover:bg-background"
          title="Save"
        >
          <Check className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Move-to-folder dropdown
// ---------------------------------------------------------------------------
function MoveToFolderButton({
  folders,
  onMove,
  disabled,
}: {
  folders: MediaFolder[];
  onMove: (folderId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
      >
        <FolderInput className="h-3.5 w-3.5" />
        Move to
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-48 rounded-lg border bg-popover p-1 shadow-lg">
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                onMove(f.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <Folder className="h-3.5 w-3.5" />
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Details drawer — preview, copy URL, rename, edit tags
// ---------------------------------------------------------------------------
function FileDetailsDrawer({
  file,
  folders,
  tags,
  onClose,
  onChanged,
  onTagCreated,
}: {
  file: MediaFile;
  folders: MediaFolder[];
  tags: MediaTag[];
  onClose: () => void;
  onChanged: () => void;
  onTagCreated: (tag: MediaTag) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [displayName, setDisplayName] = useState(fileDisplayName(file));
  const [copied, setCopied] = useState(false);

  const fileTagIds = new Set((file.tags ?? []).map((t) => t.id));
  const folder = folders.find((f) => f.id === file.folder_id);

  async function copyUrl() {
    if (!file.public_url) return;
    await navigator.clipboard.writeText(file.public_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function commitRename() {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed === fileDisplayName(file)) {
      setRenaming(false);
      setDisplayName(fileDisplayName(file));
      return;
    }
    const result = await renameFile(file.id, trimmed);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    setRenaming(false);
    onChanged();
  }

  async function toggleTag(tag: MediaTag) {
    if (fileTagIds.has(tag.id)) {
      await removeTagFromFiles(tag.id, [file.id]);
    } else {
      await applyTagToFiles(tag.id, [file.id]);
    }
    onChanged();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l bg-background shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">File details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="aspect-video overflow-hidden rounded-lg border bg-muted/30 flex items-center justify-center">
            {file.mime_type.startsWith("image/") && file.public_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.public_url}
                alt={fileDisplayName(file)}
                className="h-full w-full object-contain"
              />
            ) : file.mime_type.startsWith("video/") && file.public_url ? (
              <video
                src={file.public_url}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full"
              />
            ) : (
              <p className="text-xs text-muted-foreground">{file.mime_type}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name
            </label>
            {renaming ? (
              <div className="flex gap-1">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") {
                      setRenaming(false);
                      setDisplayName(fileDisplayName(file));
                    }
                  }}
                  className="h-9"
                  autoFocus
                />
                <Button size="sm" onClick={commitRename}>Save</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium break-all">
                  {fileDisplayName(file)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRenaming(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Public link
            </label>
            <div className="flex items-center gap-1">
              <Input readOnly value={file.public_url ?? ""} className="h-9 text-xs" />
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-medium uppercase tracking-wide text-muted-foreground">
                Folder
              </p>
              <p>{folder?.name ?? "—"}</p>
            </div>
            <div>
              <p className="font-medium uppercase tracking-wide text-muted-foreground">
                Type
              </p>
              <p>{file.mime_type}</p>
            </div>
            <div>
              <p className="font-medium uppercase tracking-wide text-muted-foreground">
                Size
              </p>
              <p>{(file.size_bytes / 1024).toFixed(1)} KB</p>
            </div>
            {file.width && file.height && (
              <div>
                <p className="font-medium uppercase tracking-wide text-muted-foreground">
                  Dimensions
                </p>
                <p>{file.width} × {file.height}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tags
            </label>
            <div className="flex flex-wrap gap-1">
              {(file.tags ?? []).map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                  style={{ background: t.color }}
                >
                  {t.name}
                </span>
              ))}
              {(file.tags ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No tags</p>
              )}
            </div>
            <TagPicker
              tags={tags}
              selectedIds={fileTagIds}
              onToggle={toggleTag}
              onCreated={onTagCreated}
              triggerLabel="Edit tags"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
