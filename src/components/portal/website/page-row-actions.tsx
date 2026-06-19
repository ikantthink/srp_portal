"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Trash2, ArrowDownToLine } from "lucide-react";
import { deletePage, duplicatePage, unpublishPage } from "@/actions/website";

interface PageRowActionsProps {
  pageId: string;
  slug: string;
  status: "draft" | "published" | string;
  title: string;
}

export function PageRowActions({ pageId, slug, status, title }: PageRowActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingDuplicate, startDuplicate] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const [pendingUnpublish, startUnpublish] = useTransition();

  // System slugs (home, listings) cannot be deleted or unpublished — the
  // server actions enforce this, but we also hide the buttons to keep the
  // UI honest. Duplicate is still allowed because it produces a new draft
  // row with a fresh slug.
  const isSystemPage = slug === "home" || slug === "listings";

  function handleDuplicate() {
    setError(null);
    startDuplicate(async () => {
      const result = await duplicatePage(pageId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/portal/website/pages/${result.id}`);
    });
  }

  function handleDelete() {
    if (isSystemPage) return;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setError(null);
    startDelete(async () => {
      const result = (await deletePage(pageId)) as { error?: string } | undefined;
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleUnpublish() {
    if (isSystemPage) return;
    setError(null);
    startUnpublish(async () => {
      const result = await unpublishPage(pageId);
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDuplicate}
        disabled={pendingDuplicate}
        aria-label="Duplicate page"
      >
        {pendingDuplicate ? (
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Copy className="mr-1 h-3.5 w-3.5" />
        )}
        Duplicate
      </Button>

      {status === "published" && !isSystemPage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnpublish}
          disabled={pendingUnpublish}
          aria-label="Unpublish page"
        >
          {pendingUnpublish ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowDownToLine className="mr-1 h-3.5 w-3.5" />
          )}
          Unpublish
        </Button>
      )}

      {!isSystemPage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={pendingDelete}
          aria-label="Delete page"
          className="text-destructive hover:text-destructive"
        >
          {pendingDelete ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="mr-1 h-3.5 w-3.5" />
          )}
          Delete
        </Button>
      )}

      {error && (
        <p className="basis-full text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
