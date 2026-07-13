"use client";

import { PuckEditor } from "@/lib/puck/editor-wrapper";
import {
  discardDraft,
  publishPage,
  savePageData,
  unpublishPage,
} from "@/actions/website";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Data } from "@puckeditor/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { PageSettingsPanel, type NavVariantOption } from "./page-settings-panel";

interface WebsitePageEditorProps {
  pageId: string;
  slug: string;
  title: string;
  metaDescription: string | null;
  initialData: Data;
  status: string;
  aiEnabled?: boolean;
  navVariants?: NavVariantOption[];
  initialNavVariantId?: string | null;
}

// Block types come as e.g. "Hero" or "Hero__abc12345" (preset variants). We
// strip the preset suffix so the hero-mismatch warning still recognizes a
// hero-derived preset as a hero.
function firstBlockBaseType(data: Data): string | null {
  const first = (data.content as Array<{ type?: string }> | undefined)?.[0];
  const t = first?.type;
  if (!t) return null;
  return t.split("__")[0];
}

const AUTOSAVE_DELAY_MS = 5000;
const SAVED_INDICATOR_MS = 2000;

export function WebsitePageEditor({
  pageId,
  slug: initialSlugProp,
  title: initialTitleProp,
  metaDescription: initialMetaProp,
  initialData,
  status: initialStatus,
  aiEnabled = false,
  navVariants = [],
  initialNavVariantId = null,
}: WebsitePageEditorProps) {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  // Slug is kept in state because the settings panel can change it and the
  // "Preview draft" button needs the current value.
  const [slug, setSlug] = useState(initialSlugProp);
  // First block type drives the transparent-nav hero-mismatch warning in
  // the settings panel. Mirrored to state from latestDataRef on every Puck
  // change so the warning stays accurate while editing.
  const [firstBlockType, setFirstBlockType] = useState<string | null>(() =>
    firstBlockBaseType(initialData)
  );

  const latestDataRef = useRef<Data>(initialData);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  // Skip the initial onChange Puck fires on mount.
  const hydratedRef = useRef(false);

  const persist = useCallback(
    async (data: Data) => {
      setSaving(true);
      try {
        const result = await savePageData(pageId, data as Record<string, unknown>);
        if ("error" in result) {
          setSaveError(result.error);
          // Leave `dirty` set so the user knows there are unsaved changes.
          return;
        }
        setSaveError(null);
        setSavedAt(Date.now());
        setDirty(false);
        dirtyRef.current = false;
      } finally {
        setSaving(false);
      }
    },
    [pageId]
  );

  const handleManualSave = useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    await persist(latestDataRef.current);
  }, [persist]);

  const handleChange = useCallback(
    (data: Data) => {
      latestDataRef.current = data;
      // Keep firstBlockType in sync; React bails out on unchanged primitives
      // so this only re-renders when the leading block actually changes.
      setFirstBlockType(firstBlockBaseType(data));
      if (!hydratedRef.current) {
        hydratedRef.current = true;
        return;
      }
      setDirty(true);
      dirtyRef.current = true;
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        autosaveTimerRef.current = null;
        void persist(latestDataRef.current);
      }, AUTOSAVE_DELAY_MS);
    },
    [persist]
  );

  // Warn the user about leaving with unsaved changes; fire a sendBeacon flush
  // on actual unmount so a quick nav doesn't lose work.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current && !saving) return;
      e.preventDefault();
      // Most browsers ignore the return value but still show their default
      // prompt; keep the message for older ones.
      e.returnValue = "";
      return "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saving]);

  useEffect(() => {
    // On unmount, flush a pending autosave via sendBeacon. The route handler
    // re-authenticates and calls savePageData server-side.
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      if (!dirtyRef.current) return;
      try {
        const payload = JSON.stringify(latestDataRef.current);
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(`/api/website/pages/${pageId}/save`, blob);
      } catch {
        // Best effort — if sendBeacon isn't available the user already got a
        // beforeunload prompt.
      }
    };
  }, [pageId]);

  useEffect(() => {
    if (savedAt === null) return;
    const t = setTimeout(() => setSavedAt(null), SAVED_INDICATOR_MS);
    return () => clearTimeout(t);
  }, [savedAt]);

  async function handlePublishToLive() {
    setActionError(null);
    setActionPending(true);
    try {
      if (dirty) await handleManualSave();
      const result = await publishPage(pageId);
      if ("error" in result) {
        setActionError(result.error);
        return;
      }
      setStatus("published");
    } finally {
      setActionPending(false);
    }
  }

  async function handleUnpublish() {
    setActionError(null);
    setActionPending(true);
    try {
      const result = await unpublishPage(pageId);
      if ("error" in result) {
        setActionError(result.error);
        return;
      }
      setStatus("draft");
    } finally {
      setActionPending(false);
    }
  }

  async function handleDiscardDraft() {
    setActionError(null);
    if (!window.confirm("Discard your draft changes and restore the last published version?")) {
      return;
    }
    setActionPending(true);
    const result = await discardDraft(pageId);
    if ("error" in result) {
      setActionError(result.error);
      setActionPending(false);
      return;
    }
    // Reload so Puck remounts with the restored draft data; no need to clear
    // actionPending since the page is about to navigate away.
    window.location.reload();
  }

  function handlePreviewDraft() {
    if (typeof window === "undefined") return;
    const path = slug === "home" ? "/" : `/${slug}`;
    window.open(`${path}?preview=draft`, "_blank", "noopener,noreferrer");
  }

  const showSavedFlash = savedAt !== null && !saving && !dirty && !saveError;

  return (
    <div className="space-y-4">
      <PageSettingsPanel
        pageId={pageId}
        initialTitle={initialTitleProp}
        initialSlug={initialSlugProp}
        initialMetaDescription={initialMetaProp}
        initialNavVariantId={initialNavVariantId}
        navVariants={navVariants}
        firstBlockType={firstBlockType}
        onSavedMeta={(next) => setSlug(next.slug)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={status === "published" ? "success" : "secondary"}>{status}</Badge>
        <Button
          size="sm"
          onClick={handleManualSave}
          disabled={saving || actionPending || !dirty}
          aria-label="Save page draft"
        >
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </Button>
        {status === "draft" ? (
          <Button size="sm" variant="outline" onClick={handlePublishToLive} disabled={saving || actionPending}>
            Publish to Live
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={handlePublishToLive} disabled={saving || actionPending}>
              Republish
            </Button>
            <Button size="sm" variant="ghost" onClick={handleUnpublish} disabled={saving || actionPending || slug === "home"}>
              Unpublish
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={handleDiscardDraft} disabled={saving || actionPending}>
          Discard draft
        </Button>
        <Button size="sm" variant="ghost" onClick={handlePreviewDraft}>
          <ExternalLink className="mr-1 h-3.5 w-3.5" />
          Preview draft
        </Button>
        <span
          className="text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {saving
            ? "Saving…"
            : saveError
              ? `Save failed: ${saveError}`
              : showSavedFlash
                ? "Saved"
                : dirty
                  ? "Unsaved changes"
                  : ""}
        </span>
      </div>

      {actionError && (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      )}

      <div className="rounded-lg border overflow-hidden" style={{ minHeight: "70vh" }}>
        <PuckEditor
          initialData={initialData}
          onChange={handleChange}
          onSave={persist}
          aiEnabled={aiEnabled}
          onAIGenerated={async (data) => {
            latestDataRef.current = data;
            await persist(data);
          }}
        />
      </div>
    </div>
  );
}
