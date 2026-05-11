"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createShortUrl, deleteShortUrl } from "@/actions/short-urls";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    const targetUrl = formData.get("target_url") as string;
    const title = formData.get("title") as string;
    const result = await createShortUrl(targetUrl, title || undefined);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setShowCreate(false);
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteShortUrl(id);
    setDeletingId(null);
  }

  function copyToClipboard(code: string, id: string) {
    const scheme = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(shortDomain)
      ? "http"
      : "https";
    navigator.clipboard.writeText(`${scheme}://${shortDomain}/s/${code}`);
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
            {shortDomain}/s/{row.original.code}
          </code>
          <button
            onClick={() => copyToClipboard(row.original.code, row.original.id)}
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
      ),
    },
  ];

  const toolbarContent = (
    <Button onClick={() => setShowCreate(true)}>
      <Plus className="mr-2 h-4 w-4" />
      New Short URL
    </Button>
  );

  return (
    <>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Create Short URL</h2>
              <button onClick={() => { setShowCreate(false); setError(null); }}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target_url">Destination URL *</Label>
                <Input
                  id="target_url"
                  name="target_url"
                  type="url"
                  placeholder="https://example.com/long-page-url"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="My marketing page"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowCreate(false); setError(null); }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
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
