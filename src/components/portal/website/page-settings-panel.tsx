"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { deletePage, updatePageMeta } from "@/actions/website";
import type { NavVariantScroll } from "@/lib/puck/components/nav-variant";

export interface NavVariantOption {
  id: string;
  name: string;
  scrollMode?: NavVariantScroll["mode"];
}

interface PageSettingsPanelProps {
  pageId: string;
  initialTitle: string;
  initialSlug: string;
  initialMetaDescription: string | null;
  initialNavVariantId?: string | null;
  navVariants?: NavVariantOption[];
  // Base type of the first Puck block on the page (preset suffix stripped).
  // Used to warn when a transparent nav variant is paired with a non-hero
  // first block. `null` means no blocks yet.
  firstBlockType?: string | null;
  onSavedMeta?: (next: {
    title: string;
    slug: string;
    meta_description: string | null;
    nav_variant_id: string | null;
  }) => void;
}

const DEFAULT_OPTION: NavVariantOption = { id: "default", name: "Default", scrollMode: "always_solid" };
const HERO_BLOCK_TYPES = new Set(["Hero", "HeroVideo"]);

export function PageSettingsPanel({
  pageId,
  initialTitle,
  initialSlug,
  initialMetaDescription,
  initialNavVariantId = null,
  navVariants = [DEFAULT_OPTION],
  firstBlockType = null,
  onSavedMeta,
}: PageSettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription ?? "");
  // null/empty maps to "default" in the UI; null is what we send to the action
  // so the DB column gets cleared (the resolver falls back to default anyway).
  const [navVariantId, setNavVariantId] = useState<string>(
    initialNavVariantId ?? "default"
  );
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pendingSave, startSave] = useTransition();
  const [pendingDelete, startDelete] = useTransition();

  // System slugs (home, listings) are stable: routing + nav defaults assume
  // them, so the slug is locked and deletion is blocked. The server actions
  // enforce this too.
  const isSystemPage = initialSlug === "home" || initialSlug === "listings";
  const systemSlugMessage =
    initialSlug === "home"
      ? "The home page slug is fixed."
      : "This page powers the /listings route — its slug is fixed.";
  const systemDeleteMessage =
    initialSlug === "home"
      ? "The home page cannot be deleted."
      : "The listings page cannot be deleted.";

  function handleSave() {
    setError(null);
    setSavedFlash(false);
    startSave(async () => {
      const cleanMeta = metaDescription.trim() || null;
      const navValue = navVariantId === "default" ? null : navVariantId;
      const result = await updatePageMeta(pageId, {
        title,
        slug: isSystemPage ? initialSlug : slug,
        meta_description: cleanMeta,
        nav_variant_id: navValue,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSavedMeta?.({
        title: title.trim(),
        slug: isSystemPage
          ? initialSlug
          : slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        meta_description: cleanMeta,
        nav_variant_id: navValue,
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    });
  }

  function handleDelete() {
    if (isSystemPage) {
      setError(systemDeleteMessage);
      return;
    }
    if (!window.confirm(`Delete "${initialTitle}"? This cannot be undone.`)) return;
    setError(null);
    startDelete(async () => {
      // deletePage redirects on success; if it returns it surfaced an error.
      const result = (await deletePage(pageId)) as { error?: string } | undefined;
      if (result?.error) setError(result.error);
    });
  }

  // Guarantee a stable "Default" option even when the prop is empty.
  const options = navVariants.length > 0 ? navVariants : [DEFAULT_OPTION];

  const selectedOption = options.find((o) => o.id === navVariantId);
  const isTransparentVariant =
    !!selectedOption?.scrollMode && selectedOption.scrollMode !== "always_solid";
  const isHeroFirstBlock = !!firstBlockType && HERO_BLOCK_TYPES.has(firstBlockType);
  const showHeroWarning = isTransparentVariant && !isHeroFirstBlock;

  return (
    <Card>
      <CardHeader className="cursor-pointer select-none" onClick={() => setOpen((v) => !v)}>
        <CardTitle className="flex items-center gap-2 text-sm">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Page Settings
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ps-title">Title</Label>
            <Input
              id="ps-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pendingSave}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ps-slug">URL slug</Label>
            <Input
              id="ps-slug"
              value={isSystemPage ? initialSlug : slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={pendingSave || isSystemPage}
            />
            <p className="text-xs text-muted-foreground">
              {isSystemPage
                ? systemSlugMessage
                : "Lowercase letters, numbers, and hyphens. Lives at /your-slug."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ps-meta">Meta description</Label>
            <Textarea
              id="ps-meta"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              disabled={pendingSave}
            />
            <p className="text-xs text-muted-foreground">
              Shown in search engine results. Aim for ~150 characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ps-nav-variant">Navigation variant</Label>
            <select
              id="ps-nav-variant"
              value={navVariantId}
              onChange={(e) => setNavVariantId(e.target.value)}
              disabled={pendingSave}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                  {opt.id === "default" ? "" : ` (${opt.id})`}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Edit variants in{" "}
              <a className="underline hover:text-foreground" href="/portal/website/chrome" target="_blank" rel="noopener noreferrer">
                Navigation &amp; Footer
              </a>
              .
            </p>
            {showHeroWarning && (
              <p
                className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700"
                role="status"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  This variant is transparent over the page&apos;s first block. The first block here is{" "}
                  <code className="font-mono">{firstBlockType ?? "empty"}</code> — consider using a Hero or
                  Hero Video block, or switch this page to the Default variant.
                </span>
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={pendingSave}>
              {pendingSave && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save settings
            </Button>
            {savedFlash && (
              <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
                Saved
              </span>
            )}
            <div className="ml-auto">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSystemPage || pendingDelete}
                title={isSystemPage ? systemDeleteMessage : undefined}
              >
                {pendingDelete ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                )}
                Delete page
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
