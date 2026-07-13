"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, Loader2, Tag as TagIcon } from "lucide-react";
import { findOrCreateTag } from "@/actions/media";
import { cn } from "@/lib/utils";
import type { MediaTag } from "@/types/database";

interface TagPickerProps {
  tags: MediaTag[];
  selectedIds: Set<string>;
  onToggle: (tag: MediaTag) => void;
  onCreated?: (tag: MediaTag) => void;
  triggerLabel: string;
  triggerIcon?: React.ReactNode;
  allowCreate?: boolean;
  placement?: "bottom" | "right";
  disabled?: boolean;
}

/**
 * Popover that shows all known tags with checkmarks, plus an inline "create
 * tag" affordance that fires when the typed query doesn't match an existing
 * tag. Used both for filtering the file list and for bulk-applying a tag to
 * selected files.
 */
export function TagPicker({
  tags,
  selectedIds,
  onToggle,
  onCreated,
  triggerLabel,
  triggerIcon,
  allowCreate = true,
  placement = "bottom",
  disabled = false,
}: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = tags.filter((t) => t.name.toLowerCase().includes(q));
  const exactMatch = tags.some((t) => t.name.toLowerCase() === q);
  const canCreate = allowCreate && q.length > 0 && !exactMatch;

  async function handleCreate() {
    if (!q) return;
    setCreating(true);
    const result = await findOrCreateTag(query.trim());
    setCreating(false);
    if ("error" in result || !result.data) return;
    onCreated?.(result.data);
    onToggle(result.data);
    setQuery("");
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none",
          open && "bg-muted/50"
        )}
      >
        {triggerIcon ?? <TagIcon className="h-3.5 w-3.5" />}
        {triggerLabel}
        {selectedIds.size > 0 && (
          <span className="rounded-full bg-brand-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {selectedIds.size}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-30 w-64 rounded-lg border bg-popover p-2 shadow-lg",
            placement === "right" ? "left-full top-0 ml-2" : "left-0 top-full mt-1"
          )}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreate) handleCreate();
            }}
            placeholder={allowCreate ? "Search or create tag..." : "Search tags..."}
            className="mb-2 h-8 w-full rounded border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />

          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && !canCreate && (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                No tags found
              </p>
            )}

            {filtered.map((tag) => {
              const selected = selectedIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onToggle(tag)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: tag.color }}
                  />
                  <span className="flex-1 truncate">{tag.name}</span>
                  {selected && <Check className="h-3.5 w-3.5 text-brand-primary" />}
                </button>
              );
            })}

            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="mt-1 flex w-full items-center gap-2 rounded border border-dashed border-border px-2 py-1.5 text-left text-sm hover:bg-muted disabled:opacity-60"
              >
                {creating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create &ldquo;{query}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
