"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  createShortUrl,
  updateShortUrl,
  deleteShortUrl,
} from "@/actions/short-urls";
import type { ShortUrl } from "@/types/database";
import {
  Plus,
  X,
  Loader2,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  LinkIcon,
  Pencil,
} from "lucide-react";

interface UrlShortenerManagerProps {
  shortUrls: ShortUrl[];
  shortDomain: string;
}

export function UrlShortenerManager({
  shortUrls,
  shortDomain,
}: UrlShortenerManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingUrl, setEditingUrl] = useState<ShortUrl | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function closeModal() {
    setShowCreate(false);
    setEditingUrl(null);
    setError(null);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const targetUrl = formData.get("target_url") as string;
    const title = formData.get("title") as string;
    const result = editingUrl
      ? await updateShortUrl(editingUrl.id, targetUrl, title || undefined)
      : await createShortUrl(targetUrl, title || undefined);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      closeModal();
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteShortUrl(id);
    setDeletingId(null);
  }

  function copyToClipboard(
    code: string,
    prefix: ShortUrl["prefix"],
    id: string
  ) {
    const scheme = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(shortDomain)
      ? "http"
      : "https";
    navigator.clipboard.writeText(
      `${scheme}://${shortDomain}/${prefix}/${code}`
    );
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const columns: ColumnDef<ShortUrl, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">
            {row.original.title || row.original.code}
          </span>
          {row.original.link_card_id && (
            <Badge variant="secondary" className="text-[10px]">
              Link Card
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: "Short URL",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-0.5 text-xs">
            {shortDomain}/{row.original.prefix}/{row.original.code}
          </code>
          <button
            onClick={() =>
              copyToClipboard(
                row.original.code,
                row.original.prefix,
                row.original.id
              )
            }
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {copiedId === row.original.id ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ),
    },
    {
      accessorKey: "target_url",
      header: "Destination",
      cell: ({ row }) => (
        <a
          href={row.original.target_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-brand-primary hover:underline max-w-[300px] truncate"
        >
          {row.original.target_url.replace(/^https?:\/\//, "")}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ),
    },
    {
      accessorKey: "click_count",
      header: "Clicks",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.click_count}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setError(null);
              setEditingUrl(row.original);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            disabled={deletingId === row.original.id}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            {deletingId === row.original.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  const toolbarContent = (
    <Button
      onClick={() => {
        setError(null);
        setShowCreate(true);
      }}
    >
      <Plus className="mr-2 h-4 w-4" />
      New Short URL
    </Button>
  );

  const modalOpen = showCreate || editingUrl;

  return (
    <>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {showCreate ? "Create Short URL" : "Edit Short URL"}
              </h2>
              <button onClick={closeModal}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              {editingUrl && (
                <div className="space-y-2">
                  <Label>Short URL</Label>
                  <code className="block rounded bg-muted px-2 py-1.5 text-xs">
                    {shortDomain}/{editingUrl.prefix}/{editingUrl.code}
                  </code>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="target_url">Destination URL *</Label>
                <Input
                  id="target_url"
                  name="target_url"
                  type="url"
                  placeholder="https://example.com/long-page-url"
                  defaultValue={editingUrl?.target_url ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="My marketing page"
                  defaultValue={editingUrl?.title ?? ""}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {showCreate ? "Create" : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={shortUrls}
        searchPlaceholder="Search short URLs..."
        toolbar={toolbarContent}
      />
    </>
  );
}
