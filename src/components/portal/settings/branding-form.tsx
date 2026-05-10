"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { GOOGLE_FONTS, googleFontUrl } from "@/lib/fonts";
import { deriveSidebarColors } from "@/lib/color-utils";
import { applyTheme } from "@/hooks/use-brand-theme";
import type { BrandSettings } from "@/types/database";
import { Loader2, RotateCcw, Upload, X } from "lucide-react";

const BUCKET = "brand-assets";
const ACCEPTED_IMAGE = "image/png,image/jpeg,image/svg+xml,image/webp";
const ACCEPTED_ICON =
  "image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp";

interface ImageUploadProps {
  label: string;
  id: string;
  currentUrl: string | null;
  accept: string;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}

function ImageUploadField({
  label,
  id,
  currentUrl,
  accept,
  onUploaded,
  onRemoved,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    setPreview(publicUrl);
    onUploaded(publicUrl);
    setUploading(false);

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    setPreview(null);
    onRemoved();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {preview ? (
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-40 rounded border border-white/10 bg-black/20 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              className="h-full w-full object-contain"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-red-400 hover:text-red-300"
          >
            <X className="mr-1 h-4 w-4" /> Remove
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 p-4 text-sm text-muted-foreground transition-colors hover:border-white/40 hover:text-white"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Click to upload"}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
        disabled={uploading}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function FontSection({
  fontHeading,
  fontBody,
  onHeadingChange,
  onBodyChange,
}: {
  fontHeading: string;
  fontBody: string;
  onHeadingChange: (v: string) => void;
  onBodyChange: (v: string) => void;
}) {
  useEffect(() => {
    const url = googleFontUrl([fontHeading, fontBody]);
    if (!url) return;

    const id = "brand-google-fonts-preview";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [fontHeading, fontBody]);

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Fonts</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="b-font-heading">Heading Font</Label>
          <select
            id="b-font-heading"
            value={fontHeading}
            onChange={(e) => onHeadingChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {GOOGLE_FONTS.map((f) => (
              <option key={f.name} value={f.name} style={{ fontFamily: `"${f.name}", ${f.category}` }}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-font-body">Body Font</Label>
          <select
            id="b-font-body"
            value={fontBody}
            onChange={(e) => onBodyChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {GOOGLE_FONTS.map((f) => (
              <option key={f.name} value={f.name} style={{ fontFamily: `"${f.name}", ${f.category}` }}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Preview</p>
        <p
          className="text-2xl font-bold"
          style={{ fontFamily: `"${fontHeading}", sans-serif` }}
        >
          The Quick Brown Fox
        </p>
        <p
          className="text-sm"
          style={{ fontFamily: `"${fontBody}", sans-serif` }}
        >
          The quick brown fox jumps over the lazy dog. Pack my box with five
          dozen liquor jugs. How vexingly quick daft zebras jump.
        </p>
      </div>
    </div>
  );
}

export function BrandingForm({
  settings,
}: {
  settings: BrandSettings | null;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    primary_color: settings?.primary_color || "#1e40af",
    secondary_color: settings?.secondary_color || "#7c3aed",
    accent_color: settings?.accent_color || "#f59e0b",
    sidebar_bg: settings?.sidebar_bg ?? null as string | null,
    sidebar_fg: settings?.sidebar_fg ?? null as string | null,
    sidebar_muted: settings?.sidebar_muted ?? null as string | null,
    font_heading: settings?.font_heading || "Inter",
    font_body: settings?.font_body || "Inter",
    logo_url: settings?.logo_url || "",
    logo_dark_url: settings?.logo_dark_url || "",
    favicon_url: settings?.favicon_url || "",
  });

  const derived = useMemo(
    () => deriveSidebarColors(form.primary_color),
    [form.primary_color]
  );

  const effectiveSidebar = {
    bg: form.sidebar_bg ?? derived.bg,
    fg: form.sidebar_fg ?? derived.fg,
    muted: form.sidebar_muted ?? derived.muted,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const supabase = createClient();

    if (settings?.id) {
      await supabase
        .from("brand_settings")
        .update(form)
        .eq("id", settings.id);
    } else {
      await supabase.from("brand_settings").insert(form);
    }

    applyTheme(form);

    setLoading(false);
    setSuccess(true);
  }

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSidebarField(key: "sidebar_bg" | "sidebar_fg" | "sidebar_muted", value: string | null) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetSidebarColors() {
    setForm((prev) => ({ ...prev, sidebar_bg: null, sidebar_fg: null, sidebar_muted: null }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Logos</h3>
        <ImageUploadField
          label="Logo"
          id="brand-logo"
          currentUrl={settings?.logo_url ?? null}
          accept={ACCEPTED_IMAGE}
          onUploaded={(url) => updateField("logo_url", url)}
          onRemoved={() => updateField("logo_url", "")}
        />
        <ImageUploadField
          label="Dark Mode Logo"
          id="brand-logo-dark"
          currentUrl={settings?.logo_dark_url ?? null}
          accept={ACCEPTED_IMAGE}
          onUploaded={(url) => updateField("logo_dark_url", url)}
          onRemoved={() => updateField("logo_dark_url", "")}
        />
        <ImageUploadField
          label="Favicon"
          id="brand-favicon"
          currentUrl={settings?.favicon_url ?? null}
          accept={ACCEPTED_ICON}
          onUploaded={(url) => updateField("favicon_url", url)}
          onRemoved={() => updateField("favicon_url", "")}
        />
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Colors</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="b-primary">Primary</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => updateField("primary_color", e.target.value)}
                className="h-10 w-10 rounded cursor-pointer"
              />
              <Input
                id="b-primary"
                value={form.primary_color}
                onChange={(e) => updateField("primary_color", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-secondary">Secondary</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.secondary_color}
                onChange={(e) => updateField("secondary_color", e.target.value)}
                className="h-10 w-10 rounded cursor-pointer"
              />
              <Input
                id="b-secondary"
                value={form.secondary_color}
                onChange={(e) => updateField("secondary_color", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-accent">Accent</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) => updateField("accent_color", e.target.value)}
                className="h-10 w-10 rounded cursor-pointer"
              />
              <Input
                id="b-accent"
                value={form.accent_color}
                onChange={(e) => updateField("accent_color", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <div
            className="flex-1 rounded-lg p-4 text-center text-white text-sm font-medium"
            style={{ backgroundColor: form.primary_color }}
          >
            Primary
          </div>
          <div
            className="flex-1 rounded-lg p-4 text-center text-white text-sm font-medium"
            style={{ backgroundColor: form.secondary_color }}
          >
            Secondary
          </div>
          <div
            className="flex-1 rounded-lg p-4 text-center text-black text-sm font-medium"
            style={{ backgroundColor: form.accent_color }}
          >
            Accent
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Sidebar Colors</h3>
          {(form.sidebar_bg || form.sidebar_fg || form.sidebar_muted) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetSidebarColors}
              className="text-muted-foreground"
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset to auto
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Leave on auto to derive from the primary brand color, or pick custom values.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="b-sidebar-bg">Background</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={effectiveSidebar.bg}
                onChange={(e) => updateSidebarField("sidebar_bg", e.target.value)}
                className="h-10 w-10 rounded cursor-pointer"
              />
              <Input
                id="b-sidebar-bg"
                value={effectiveSidebar.bg}
                onChange={(e) => updateSidebarField("sidebar_bg", e.target.value)}
                placeholder="Auto"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-sidebar-fg">Text</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={effectiveSidebar.fg}
                onChange={(e) => updateSidebarField("sidebar_fg", e.target.value)}
                className="h-10 w-10 rounded cursor-pointer"
              />
              <Input
                id="b-sidebar-fg"
                value={effectiveSidebar.fg}
                onChange={(e) => updateSidebarField("sidebar_fg", e.target.value)}
                placeholder="Auto"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-sidebar-muted">Hover / Muted</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={effectiveSidebar.muted}
                onChange={(e) => updateSidebarField("sidebar_muted", e.target.value)}
                className="h-10 w-10 rounded cursor-pointer"
              />
              <Input
                id="b-sidebar-muted"
                value={effectiveSidebar.muted}
                onChange={(e) => updateSidebarField("sidebar_muted", e.target.value)}
                placeholder="Auto"
              />
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-3 rounded-lg p-4 text-sm"
          style={{ backgroundColor: effectiveSidebar.bg }}
        >
          <div
            className="rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: effectiveSidebar.muted, color: "#ffffff" }}
          >
            Active
          </div>
          <span style={{ color: effectiveSidebar.fg, opacity: 0.7 }} className="text-xs font-semibold uppercase tracking-wider">
            Inactive
          </span>
        </div>
      </div>

      <FontSection
        fontHeading={form.font_heading}
        fontBody={form.font_body}
        onHeadingChange={(v) => updateField("font_heading", v)}
        onBodyChange={(v) => updateField("font_body", v)}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Brand Settings
        </Button>
        {success && <span className="text-sm text-emerald-600">Saved!</span>}
      </div>
    </form>
  );
}
