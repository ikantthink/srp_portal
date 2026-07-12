"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copyright,
  ExternalLink,
  GripVertical,
  Image as ImageIcon,
  ImagePlus,
  Link2,
  List as ListIcon,
  Loader2,
  Lock,
  Plus,
  Rows3,
  Share2,
  StretchHorizontal,
  Trash2,
  Type as TypeIcon,
  Ungroup,
} from "lucide-react";
import { MediaPicker } from "@/components/portal/media/media-picker";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  deleteNavVariant,
  saveSiteFooter,
  upsertNavVariant,
} from "@/actions/site-chrome";
import {
  LOGO_THEME_DARK,
  LOGO_THEME_LIGHT,
  NAV_VARIANT_DEFAULTS,
  THEME_COLOR_TOKENS,
  mergeNavVariant,
  type LogoResolutionBrand,
  type NavVariant,
  type NavVariantScroll,
  type NavVariantStyle,
  type ThemeColorToken,
} from "@/lib/puck/components/nav-variant";
import {
  makeFooterBlock,
  makeFooterLeafBlock,
  makeFooterRow,
  makeInlineRowBlock,
  sanitizeWeight,
  FOOTER_COLUMN_WEIGHT_DEFAULT,
  type FooterBlock,
  type FooterBlockAlign,
  type FooterBlockType,
  type FooterCopyrightBlock,
  type FooterImageBlock,
  type FooterImageLinkBlock,
  type FooterInlineRowBlock,
  type FooterInlineRowVerticalAlign,
  type FooterLeafBlock,
  type FooterLeafBlockType,
  type FooterLinkListBlock,
  type FooterProps,
  type FooterRow,
  type FooterSocialBlock,
  type FooterStyle,
  type FooterTextBlock,
  legacyTextToHtml,
} from "@/lib/puck/components/Footer";
import { WysiwygFieldRender } from "@/lib/puck/fields/wysiwyg-field-renderer";

interface ChromeEditorProps {
  initialVariants: NavVariant[];
  initialFooter: FooterProps;
  brandLogos?: LogoResolutionBrand | null;
}

export function ChromeEditor({
  initialVariants,
  initialFooter,
  brandLogos = null,
}: ChromeEditorProps) {
  const safeInitial = initialVariants.length > 0 ? initialVariants : [NAV_VARIANT_DEFAULTS];
  return (
    <div className="space-y-8">
      <NavVariantsSection initial={safeInitial} brandLogos={brandLogos} />
      <FooterCard initial={initialFooter} />
    </div>
  );
}

const NEW_VARIANT_KEY = "__new__";

function emptyNewVariant(): NavVariant {
  return mergeNavVariant({
    id: "",
    name: "New variant",
    links: "",
    ctaText: "",
    ctaLink: "",
    logoText: "",
    logoUrl: "",
  });
}

function NavVariantsSection({
  initial,
  brandLogos,
}: {
  initial: NavVariant[];
  brandLogos: LogoResolutionBrand | null;
}) {
  const [variants, setVariants] = useState<NavVariant[]>(initial);
  const [selectedId, setSelectedId] = useState<string>(initial[0]?.id ?? "default");
  const [draft, setDraft] = useState<NavVariant | null>(null);

  const selected = useMemo(() => {
    if (selectedId === NEW_VARIANT_KEY) return draft ?? emptyNewVariant();
    return variants.find((v) => v.id === selectedId) ?? variants[0];
  }, [selectedId, variants, draft]);

  function selectExisting(id: string) {
    setSelectedId(id);
    setDraft(null);
  }

  function startNew() {
    const fresh = emptyNewVariant();
    setDraft(fresh);
    setSelectedId(NEW_VARIANT_KEY);
  }

  function onSaved(saved: NavVariant) {
    setVariants((prev) => {
      const exists = prev.some((v) => v.id === saved.id);
      return exists
        ? prev.map((v) => (v.id === saved.id ? saved : v))
        : [...prev, saved];
    });
    setDraft(null);
    setSelectedId(saved.id);
  }

  function onDeleted(id: string) {
    setVariants((prev) => prev.filter((v) => v.id !== id));
    setSelectedId("default");
    setDraft(null);
  }

  // Pin "default" first, then list the rest in their stored order.
  const orderedExisting = useMemo(() => {
    const def = variants.find((v) => v.id === "default");
    const rest = variants.filter((v) => v.id !== "default");
    return def ? [def, ...rest] : rest;
  }, [variants]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Navigation variants</CardTitle>
        <p className="text-sm text-muted-foreground">
          Define one or more headers. Each page picks the variant it should render
          from the Page Settings panel; pages without a selection fall back to
          Default.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <aside className="space-y-1">
            {orderedExisting.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => selectExisting(v.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  selectedId === v.id
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{v.name}</span>
                  {v.id === "default" && (
                    <Lock className="h-3 w-3 text-muted-foreground" aria-label="Default" />
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">{v.id}</div>
              </button>
            ))}
            <button
              type="button"
              onClick={startNew}
              className={`mt-2 w-full rounded-md border border-dashed px-3 py-2 text-left text-sm transition hover:bg-muted/50 ${
                selectedId === NEW_VARIANT_KEY ? "bg-muted" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" /> New variant
              </span>
            </button>
          </aside>
          <div>
            <VariantForm
              key={selectedId}
              variant={selected}
              isNew={selectedId === NEW_VARIANT_KEY}
              brandLogos={brandLogos}
              onSaved={onSaved}
              onDeleted={onDeleted}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface VariantFormProps {
  variant: NavVariant;
  isNew: boolean;
  brandLogos: LogoResolutionBrand | null;
  onSaved: (saved: NavVariant) => void;
  onDeleted: (id: string) => void;
}

function VariantForm({ variant, isNew, brandLogos, onSaved, onDeleted }: VariantFormProps) {
  const [draft, setDraft] = useState<NavVariant>(variant);
  const [pendingSave, startSave] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const isDefault = draft.id === "default";
  const scrollMode = draft.scroll.mode;
  const stickyForced = scrollMode !== "always_solid";

  function setTop<K extends keyof NavVariant>(key: K, value: NavVariant[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function setStyle<K extends keyof NavVariantStyle>(key: K, value: NavVariantStyle[K]) {
    setDraft((prev) => ({ ...prev, style: { ...prev.style, [key]: value } }));
  }

  function setScroll<K extends keyof NavVariantScroll>(key: K, value: NavVariantScroll[K]) {
    setDraft((prev) => ({ ...prev, scroll: { ...prev.scroll, [key]: value } }));
  }

  function handleSave() {
    setError(null);
    setSavedFlash(false);
    if (!draft.name.trim()) {
      setError("Name is required");
      return;
    }
    startSave(async () => {
      const result = await upsertNavVariant(draft);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSaved(result.variant);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    });
  }

  function handleDelete() {
    if (isDefault) return;
    if (!window.confirm(`Delete variant "${draft.name}"? Pages using it will fall back to Default.`)) return;
    setError(null);
    startDelete(async () => {
      const result = await deleteNavVariant(draft.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onDeleted(draft.id);
    });
  }

  return (
    <div className="space-y-6">
      <FormSection title="Identity">
        <div className="space-y-2">
          <Label htmlFor="v-name">Name</Label>
          <Input
            id="v-name"
            value={draft.name}
            onChange={(e) => setTop("name", e.target.value)}
            disabled={pendingSave}
          />
          {!isNew && (
            <p className="text-xs text-muted-foreground">
              Variant ID: <code>{draft.id}</code> (immutable)
            </p>
          )}
          {isNew && (
            <p className="text-xs text-muted-foreground">
              An ID will be generated from the name when you save.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="v-logoText">Logo text</Label>
          <Input
            id="v-logoText"
            value={draft.logoText}
            onChange={(e) => setTop("logoText", e.target.value)}
            disabled={pendingSave}
          />
          <p className="text-xs text-muted-foreground">
            Shown when no logo image is set.
          </p>
        </div>
        <LogoField
          label="Logo image"
          value={draft.logoUrl}
          onChange={(v) => setTop("logoUrl", v)}
          disabled={pendingSave}
          brandLogos={brandLogos}
          autoLabel="Auto"
          autoHint="Auto uses the brand logo from Settings → Branding. Pick a specific source below to override."
        />
      </FormSection>

      <FormSection title="Content">
        <div className="space-y-2">
          <Label htmlFor="v-links">Links</Label>
          <Textarea
            id="v-links"
            value={draft.links}
            onChange={(e) => setTop("links", e.target.value)}
            rows={5}
            disabled={pendingSave}
          />
          <p className="text-xs text-muted-foreground">
            One per line, formatted as <code>Label|/href</code>.
          </p>
          <LinksPreview value={draft.links} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="v-ctaText">CTA text</Label>
            <Input
              id="v-ctaText"
              value={draft.ctaText}
              onChange={(e) => setTop("ctaText", e.target.value)}
              disabled={pendingSave}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-ctaLink">CTA link</Label>
            <Input
              id="v-ctaLink"
              value={draft.ctaLink}
              onChange={(e) => setTop("ctaLink", e.target.value)}
              disabled={pendingSave}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Layout">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="v-height">Height (px)</Label>
            <Input
              id="v-height"
              type="number"
              min={40}
              max={160}
              value={draft.style.height}
              onChange={(e) => setStyle("height", Number(e.target.value) || 0)}
              disabled={pendingSave}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-linkGap">Link gap (px)</Label>
            <Input
              id="v-linkGap"
              type="number"
              min={0}
              max={64}
              value={draft.style.linkGap}
              onChange={(e) => setStyle("linkGap", Number(e.target.value) || 0)}
              disabled={pendingSave}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Max width</Label>
          <RadioRow
            name="v-maxWidth"
            value={draft.style.maxWidth}
            onChange={(v) => setStyle("maxWidth", v as NavVariantStyle["maxWidth"])}
            options={[
              { value: "narrow", label: "Narrow (768px)" },
              { value: "default", label: "Default (1280px)" },
              { value: "wide", label: "Wide (1536px)" },
              { value: "full", label: "Full" },
            ]}
          />
        </div>
        <div className="space-y-2">
          <Label>Sticky header</Label>
          <RadioRow
            name="v-sticky"
            value={draft.sticky}
            onChange={(v) => setTop("sticky", v as "yes" | "no")}
            options={[
              { value: "yes", label: "Sticky" },
              { value: "no", label: "Not sticky" },
            ]}
            disabled={stickyForced}
          />
          {stickyForced && (
            <p className="text-xs text-muted-foreground">
              Transparent scroll modes always sticky so the effect makes sense.
            </p>
          )}
        </div>
      </FormSection>

      <FormSection title="Typography">
        <div className="space-y-2">
          <Label htmlFor="v-fontFamily">Font family</Label>
          <Input
            id="v-fontFamily"
            value={draft.style.fontFamily}
            onChange={(e) => setStyle("fontFamily", e.target.value)}
            placeholder="inherit"
            disabled={pendingSave}
          />
          <p className="text-xs text-muted-foreground">
            CSS font-family value. Blank = inherit from the page.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="v-fontSize">Font size (px)</Label>
            <Input
              id="v-fontSize"
              type="number"
              min={10}
              max={24}
              value={draft.style.fontSize}
              onChange={(e) => setStyle("fontSize", Number(e.target.value) || 0)}
              disabled={pendingSave}
            />
          </div>
          <div className="space-y-2">
            <Label>Weight</Label>
            <RadioRow
              name="v-fontWeight"
              value={draft.style.fontWeight}
              onChange={(v) => setStyle("fontWeight", v as NavVariantStyle["fontWeight"])}
              options={[
                { value: "regular", label: "Regular" },
                { value: "medium", label: "Medium" },
                { value: "semibold", label: "Semibold" },
                { value: "bold", label: "Bold" },
              ]}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Colors">
        <ColorField label="Background" value={draft.style.backgroundColor} onChange={(v) => setStyle("backgroundColor", v)} />
        <ColorField label="Text" value={draft.style.textColor} onChange={(v) => setStyle("textColor", v)} />
        <ColorField label="Link" value={draft.style.linkColor} onChange={(v) => setStyle("linkColor", v)} />
        <ColorField label="Link hover" value={draft.style.linkHoverColor} onChange={(v) => setStyle("linkHoverColor", v)} />
        <ColorField label="CTA background" value={draft.style.ctaBackgroundColor} onChange={(v) => setStyle("ctaBackgroundColor", v)} />
        <ColorField label="CTA text" value={draft.style.ctaTextColor} onChange={(v) => setStyle("ctaTextColor", v)} />
      </FormSection>

      <FormSection title="Scroll behavior">
        <div className="space-y-2">
          <Label>Mode</Label>
          <RadioRow
            name="v-scroll-mode"
            value={scrollMode}
            onChange={(v) => setScroll("mode", v as NavVariantScroll["mode"])}
            options={[
              { value: "always_solid", label: "Always solid" },
              { value: "transparent_until_scroll", label: "Transparent until scroll" },
              { value: "transparent_over_hero", label: "Transparent over hero" },
            ]}
            stack
          />
          <p className="text-xs text-muted-foreground">
            Transparent modes are designed for pages that begin with a full-bleed
            hero — the header overlays the hero and turns solid when the user
            scrolls past it.
          </p>
        </div>

        {scrollMode === "transparent_until_scroll" && (
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="v-threshold">Threshold (px)</Label>
            <Input
              id="v-threshold"
              type="number"
              min={0}
              max={2000}
              value={draft.scroll.threshold}
              onChange={(e) => setScroll("threshold", Number(e.target.value) || 0)}
              disabled={pendingSave}
            />
          </div>
        )}

        {scrollMode !== "always_solid" && (
          <>
            <ColorField
              label="Transparent text/link"
              value={draft.scroll.transparentTextColor}
              onChange={(v) => setScroll("transparentTextColor", v)}
            />
            <ColorField
              label="Transparent logo"
              value={draft.scroll.transparentLogoColor}
              onChange={(v) => setScroll("transparentLogoColor", v)}
            />
            <ColorField
              label="Solid background"
              value={draft.scroll.solidBackgroundColor}
              onChange={(v) => setScroll("solidBackgroundColor", v)}
            />
            <LogoField
              label="Transparent logo image"
              value={draft.scroll.transparentLogoUrl}
              onChange={(v) => setScroll("transparentLogoUrl", v)}
              disabled={pendingSave}
              brandLogos={brandLogos}
              autoLabel="Same as solid"
              autoHint="Use the Identity logo above. Pick a different source below to swap when the nav is transparent (e.g. light logo over a dark hero)."
            />
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="v-transition">Transition (ms)</Label>
              <Input
                id="v-transition"
                type="number"
                min={0}
                max={2000}
                value={draft.scroll.transitionMs}
                onChange={(e) => setScroll("transitionMs", Number(e.target.value) || 0)}
                disabled={pendingSave}
              />
            </div>
          </>
        )}
      </FormSection>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={pendingSave}>
          {pendingSave && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {isNew ? "Create variant" : "Save variant"}
        </Button>
        {savedFlash && (
          <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
            Saved
          </span>
        )}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" /> View live
        </a>
        {!isDefault && !isNew && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={pendingDelete}
          >
            {pendingDelete ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-3.5 w-3.5" />
            )}
            Delete variant
          </Button>
        )}
      </div>
    </div>
  );
}

type LogoSource = "auto" | "brand-light" | "brand-dark" | "custom";

function logoSourceFromValue(value: string): LogoSource {
  if (!value) return "auto";
  if (value === LOGO_THEME_LIGHT) return "brand-light";
  if (value === LOGO_THEME_DARK) return "brand-dark";
  return "custom";
}

/**
 * Logo image picker. Lets the editor pick between:
 *  - "Auto"  (or "Same as solid" for the transparent variant) — empty value;
 *    the renderer picks the configured brand logo / parent logo.
 *  - Brand light logo — stores `theme:brand-logo`; thumbnail shown when the
 *    brand has uploaded a logo, else the option is disabled with a hint.
 *  - Brand dark logo  — stores `theme:brand-logo-dark`.
 *  - Custom URL — stores the URL verbatim; gets a URL input and a Browse
 *    Media button so editors can pick from the media library.
 */
function LogoField({
  label,
  value,
  onChange,
  disabled,
  brandLogos,
  autoLabel,
  autoHint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  brandLogos: LogoResolutionBrand | null;
  /** Label shown for the "empty value" option (e.g. "Auto" or "Same as solid"). */
  autoLabel: string;
  /** Hint shown under the picker when the empty option is selected. */
  autoHint: string;
}) {
  const inputId = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const source = logoSourceFromValue(value);

  const lightUrl = brandLogos?.logoUrl ?? null;
  const darkUrl = brandLogos?.logoDarkUrl ?? null;

  function selectSource(next: LogoSource) {
    if (next === "auto") return onChange("");
    if (next === "brand-light") return onChange(LOGO_THEME_LIGHT);
    if (next === "brand-dark") return onChange(LOGO_THEME_DARK);
    // Switching to Custom from a theme/empty value clears it so the URL input
    // starts blank; the user then types or browses to fill it.
    if (source !== "custom") return onChange("");
  }

  // The resolved thumbnail URL for whatever the current value points to.
  const thumbnailUrl =
    source === "brand-light"
      ? lightUrl ?? ""
      : source === "brand-dark"
        ? darkUrl ?? ""
        : source === "custom"
          ? value
          : "";

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div
        role="radiogroup"
        aria-label={`${label} source`}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        <LogoSourceTile
          selected={source === "auto"}
          onClick={() => selectSource("auto")}
          disabled={disabled}
          label={autoLabel}
        />
        <LogoSourceTile
          selected={source === "brand-light"}
          onClick={() => selectSource("brand-light")}
          disabled={disabled || !lightUrl}
          label="Brand logo"
          previewUrl={lightUrl}
          unavailableHint={!lightUrl ? "Not set" : undefined}
        />
        <LogoSourceTile
          selected={source === "brand-dark"}
          onClick={() => selectSource("brand-dark")}
          disabled={disabled || !darkUrl}
          label="Brand dark logo"
          previewUrl={darkUrl}
          unavailableHint={!darkUrl ? "Not set" : undefined}
          dark
        />
        <LogoSourceTile
          selected={source === "custom"}
          onClick={() => selectSource("custom")}
          disabled={disabled}
          label="Custom"
          previewUrl={source === "custom" ? value : ""}
        />
      </div>

      {source === "custom" && (
        <div className="flex gap-2">
          <Input
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or use Browse"
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
            disabled={disabled}
            className="shrink-0"
          >
            <ImagePlus className="mr-1 h-3.5 w-3.5" /> Browse
          </Button>
        </div>
      )}

      {source === "auto" && (
        <p className="text-xs text-muted-foreground">
          {autoHint}{" "}
          {(!lightUrl && !darkUrl) && (
            <>
              Upload brand logos in{" "}
              <a
                className="underline hover:text-foreground"
                href="/portal/settings/branding"
                target="_blank"
                rel="noopener noreferrer"
              >
                Settings → Branding
              </a>
              .
            </>
          )}
        </p>
      )}

      {thumbnailUrl && source !== "auto" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Preview:</span>
          <div
            className={`flex h-10 w-24 items-center justify-center overflow-hidden rounded border border-input ${
              source === "brand-dark" ? "bg-neutral-800" : "bg-muted/30"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- editor-supplied URL */}
            <img src={thumbnailUrl} alt="" className="h-full w-full object-contain" />
          </div>
        </div>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(urls) => urls[0] && onChange(urls[0])}
        accept="image"
      />
    </div>
  );
}

function LogoSourceTile({
  selected,
  onClick,
  disabled,
  label,
  previewUrl,
  unavailableHint,
  dark,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  previewUrl?: string | null;
  unavailableHint?: string;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      disabled={disabled}
      title={unavailableHint ? `${label} — ${unavailableHint}` : label}
      className={`flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition ${
        selected
          ? "border-foreground bg-muted"
          : "border-border hover:bg-muted/50"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <div
        className={`flex h-10 w-full items-center justify-center overflow-hidden rounded border border-input ${
          dark ? "bg-neutral-800" : "bg-muted/40"
        }`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- editor-supplied URL
          <img src={previewUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className={`px-1 text-center text-[10px] leading-tight ${dark ? "text-neutral-400" : "text-muted-foreground"}`}>
            {unavailableHint ?? "—"}
          </span>
        )}
      </div>
      <span className="font-medium text-foreground">{label}</span>
    </button>
  );
}

type ClassifiedLink =
  | { kind: "valid"; label: string; href: string }
  | { kind: "malformed"; raw: string; reason: string };

function classifyLinks(value: string): ClassifiedLink[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map<ClassifiedLink>((line) => {
      if (!line.includes("|")) {
        return {
          kind: "malformed",
          raw: line,
          reason: 'missing "|" separator',
        };
      }
      const [labelRaw, hrefRaw] = line.split("|");
      const label = labelRaw?.trim() ?? "";
      const href = hrefRaw?.trim() ?? "";
      if (!label) return { kind: "malformed", raw: line, reason: "empty label" };
      if (!href) return { kind: "malformed", raw: line, reason: "empty href" };
      return { kind: "valid", label, href };
    });
}

/**
 * Surfaces what the link parser actually accepts and rejects. The renderer
 * silently drops malformed lines, which had editors thinking "Save" wasn't
 * working when really their separator was wrong.
 */
function LinksPreview({ value }: { value: string }) {
  const classified = classifyLinks(value);
  if (classified.length === 0) return null;

  const valid = classified.filter((c) => c.kind === "valid").length;
  const malformed = classified.length - valid;

  return (
    <div className="space-y-1 rounded-md border border-dashed border-border bg-muted/20 p-2 text-xs">
      <p className="font-medium text-foreground">
        {valid} link{valid === 1 ? "" : "s"} will render
        {malformed > 0 && (
          <>
            ; <span className="text-amber-700">{malformed} line{malformed === 1 ? "" : "s"} hidden</span>
          </>
        )}
      </p>
      <ul className="space-y-0.5">
        {classified.map((c, i) =>
          c.kind === "valid" ? (
            <li key={i} className="flex items-start gap-2 text-muted-foreground">
              <span className="text-emerald-600" aria-hidden="true">
                ✓
              </span>
              <span>
                <span className="font-medium text-foreground">{c.label}</span> →{" "}
                <code className="font-mono">{c.href}</code>
              </span>
            </li>
          ) : (
            <li key={i} className="flex items-start gap-2 text-amber-700">
              <span aria-hidden="true">!</span>
              <span>
                <code className="font-mono">{c.raw}</code> — {c.reason}.
              </span>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-muted-foreground/10">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function RadioRow({
  name,
  value,
  onChange,
  options,
  disabled = false,
  stack = false,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  stack?: boolean;
}) {
  return (
    <div className={`flex ${stack ? "flex-col gap-2" : "flex-wrap gap-4"} text-sm`}>
      {options.map((opt) => (
        <label key={opt.value} className={`flex items-center gap-2 ${disabled ? "opacity-50" : ""}`}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            disabled={disabled}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

// Display labels for the brand theme tokens shown in the ColorField select.
const THEME_TOKEN_LABELS: Record<ThemeColorToken, string> = {
  primary: "Brand primary",
  secondary: "Brand secondary",
  accent: "Brand accent",
  background: "Page background",
  foreground: "Page text",
};

// Hex fallbacks used when the editor switches a field from Theme → Custom.
// These mirror the defaults in `use-brand-theme.ts` / `globals.css`; they're
// only seeds for the color picker, so going slightly stale won't render
// incorrectly (the live page always reads the actual --brand-* vars).
const THEME_TOKEN_FALLBACK_HEX: Record<ThemeColorToken, string> = {
  primary: "#1e40af",
  secondary: "#7c3aed",
  accent: "#f59e0b",
  background: "#ffffff",
  foreground: "#1a1a2e",
};

function parseThemeValue(value: string | null | undefined): ThemeColorToken | null {
  // Be defensive about the input shape — saved footer payloads from older
  // versions can store text blocks with missing `color`/other color fields,
  // and we'd rather surface "no theme" than crash the entire editor when a
  // single value is missing.
  if (typeof value !== "string" || !value.startsWith("theme:")) return null;
  const token = value.slice("theme:".length);
  return (THEME_COLOR_TOKENS as readonly string[]).includes(token)
    ? (token as ThemeColorToken)
    : null;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const themeToken = parseThemeValue(value);
  const mode: "theme" | "custom" = themeToken ? "theme" : "custom";

  function switchToTheme() {
    if (themeToken) return;
    onChange("theme:primary");
  }

  function switchToCustom() {
    if (!themeToken) return;
    onChange(THEME_TOKEN_FALLBACK_HEX[themeToken]);
  }

  // `<input type="color">` only accepts 6-digit hex; if a saved value is in
  // rgba()/named form we keep the swatch black and let the text input drive
  // the real value so non-hex stays preserved.
  const isHex = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="inline-flex overflow-hidden rounded-md border border-input text-xs">
          <button
            type="button"
            onClick={switchToTheme}
            className={`px-2 py-1 transition ${
              mode === "theme" ? "bg-muted font-medium" : "hover:bg-muted/50"
            }`}
            aria-pressed={mode === "theme"}
          >
            Theme
          </button>
          <button
            type="button"
            onClick={switchToCustom}
            className={`px-2 py-1 transition ${
              mode === "custom" ? "bg-muted font-medium" : "hover:bg-muted/50"
            }`}
            aria-pressed={mode === "custom"}
          >
            Custom
          </button>
        </div>
      </div>
      {mode === "theme" ? (
        // Native <option> elements can't render color swatches, so the
        // five theme tokens are shown as clickable chips. The chip swatch
        // is backed by the live --brand-*/--background/--foreground CSS
        // var, so it reflects the user's current brand settings in real
        // time without us duplicating those values here.
        <div
          role="radiogroup"
          aria-label={`${label} theme token`}
          className="flex flex-wrap gap-1.5"
        >
          {THEME_COLOR_TOKENS.map((token) => {
            const isSelected = themeToken === token;
            const cssVar =
              token === "background" || token === "foreground"
                ? `var(--${token})`
                : `var(--brand-${token})`;
            return (
              <button
                key={token}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange(`theme:${token}`)}
                className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                  isSelected
                    ? "border-foreground bg-muted"
                    : "border-border hover:bg-muted/50"
                }`}
                title={THEME_TOKEN_LABELS[token]}
              >
                <span
                  className="h-4 w-4 rounded-sm border border-black/10"
                  style={{ backgroundColor: cssVar }}
                  aria-hidden="true"
                />
                <span>{THEME_TOKEN_LABELS[token]}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={isHex ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
            aria-label={`${label} color picker`}
          />
          <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm" />
        </div>
      )}
    </div>
  );
}

const COLUMN_DROPPABLE_PREFIX = "ft-col-";
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 6;
const MIN_ROWS = 1;
const MAX_ROWS = 6;

/** Encode a (row, col) coordinate into a stable droppable id. */
function columnDroppableId(rowIndex: number, colIndex: number): string {
  return `${COLUMN_DROPPABLE_PREFIX}r${rowIndex}-c${colIndex}`;
}

/** Parse a droppable id back into its (row, col) coordinate, or null if it
 * isn't a column droppable id. */
function parseColumnDroppableId(
  id: string
): { row: number; col: number } | null {
  if (!id.startsWith(COLUMN_DROPPABLE_PREFIX)) return null;
  const rest = id.slice(COLUMN_DROPPABLE_PREFIX.length);
  const match = /^r(\d+)-c(\d+)$/.exec(rest);
  if (!match) return null;
  const row = Number.parseInt(match[1], 10);
  const col = Number.parseInt(match[2], 10);
  if (Number.isNaN(row) || Number.isNaN(col)) return null;
  return { row, col };
}

interface BlockLocation {
  row: number;
  col: number;
  index: number;
}

function findLocationOfBlock(
  rows: FooterRow[],
  blockId: string
): BlockLocation | null {
  for (let ri = 0; ri < rows.length; ri++) {
    const cols = rows[ri].columns;
    for (let ci = 0; ci < cols.length; ci++) {
      const idx = cols[ci].findIndex((b) => b.id === blockId);
      if (idx !== -1) return { row: ri, col: ci, index: idx };
    }
  }
  return null;
}

// Leaf block options — everything that can live directly inside a column OR
// inside an inline row block. Inline row blocks themselves are NOT leaves
// (no nested inline rows allowed).
const LEAF_BLOCK_TYPE_OPTIONS: {
  value: FooterLeafBlockType;
  label: string;
  icon: typeof ListIcon;
}[] = [
  { value: "linkList", label: "Link list", icon: ListIcon },
  { value: "text", label: "Text", icon: TypeIcon },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "imageLink", label: "Image link", icon: Link2 },
  { value: "social", label: "Social links", icon: Share2 },
  { value: "copyright", label: "Copyright", icon: Copyright },
];

// Full block options shown in the column's + menu — leaves plus the inline
// row container.
const BLOCK_TYPE_OPTIONS: { value: FooterBlockType; label: string; icon: typeof ListIcon }[] = [
  ...LEAF_BLOCK_TYPE_OPTIONS,
  { value: "inlineRow", label: "Inline row", icon: Rows3 },
];

function blockTypeLabel(type: FooterBlockType): string {
  return BLOCK_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Block";
}

function blockSummary(block: FooterBlock): string {
  if (block.type === "linkList") return block.title || "Untitled list";
  if (block.type === "image") return block.alt || "Image";
  if (block.type === "imageLink") return block.alt || block.href || "Image link";
  if (block.type === "text") return block.heading || block.body || "Text";
  if (block.type === "copyright") return block.text || "Copyright";
  if (block.type === "inlineRow") {
    const n = block.children.length;
    return n === 0 ? "Empty inline row" : `Inline row (${n} ${n === 1 ? "block" : "blocks"})`;
  }
  return "Social links";
}

function FooterCard({ initial }: { initial: FooterProps }) {
  const [footer, setFooter] = useState<FooterProps>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pending, start] = useTransition();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function setStyleField<K extends keyof FooterStyle>(key: K, value: FooterStyle[K]) {
    setFooter((prev) => ({ ...prev, style: { ...prev.style, [key]: value } }));
  }

  function setColorField(
    key: "backgroundColor" | "textColor" | "linkColor" | "linkHoverColor",
    value: string
  ) {
    setFooter((prev) => ({ ...prev, [key]: value }));
  }

  function setRows(updater: (rows: FooterRow[]) => FooterRow[]) {
    setFooter((prev) => ({ ...prev, rows: updater(prev.rows) }));
  }

  function updateBlock(
    rowIndex: number,
    columnIndex: number,
    blockId: string,
    updater: (b: FooterBlock) => FooterBlock
  ) {
    setRows((rows) =>
      rows.map((row, ri) =>
        ri === rowIndex
          ? {
              ...row,
              columns: row.columns.map((col, ci) =>
                ci === columnIndex
                  ? col.map((b) => (b.id === blockId ? updater(b) : b))
                  : col
              ),
            }
          : row
      )
    );
  }

  function addBlock(rowIndex: number, columnIndex: number, type: FooterBlockType) {
    setRows((rows) =>
      rows.map((row, ri) =>
        ri === rowIndex
          ? {
              ...row,
              columns: row.columns.map((col, ci) =>
                ci === columnIndex ? [...col, makeFooterBlock(type)] : col
              ),
            }
          : row
      )
    );
  }

  function removeBlock(rowIndex: number, columnIndex: number, blockId: string) {
    setRows((rows) =>
      rows.map((row, ri) =>
        ri === rowIndex
          ? {
              ...row,
              columns: row.columns.map((col, ci) =>
                ci === columnIndex ? col.filter((b) => b.id !== blockId) : col
              ),
            }
          : row
      )
    );
  }

  /** Move a block by one column in the same row (-1 left, +1 right). */
  function moveBlockHorizontal(blockId: string, direction: -1 | 1) {
    setRows((rows) => {
      const loc = findLocationOfBlock(rows, blockId);
      if (!loc) return rows;
      const row = rows[loc.row];
      const toCol = loc.col + direction;
      if (toCol < 0 || toCol >= row.columns.length) return rows;
      const item = row.columns[loc.col].find((b) => b.id === blockId);
      if (!item) return rows;
      const nextColumns = row.columns.map((c) => [...c]);
      nextColumns[loc.col] = nextColumns[loc.col].filter((b) => b.id !== blockId);
      nextColumns[toCol] = [...nextColumns[toCol], item];
      return rows.map((r, ri) =>
        ri === loc.row ? { ...r, columns: nextColumns } : r
      );
    });
  }

  /** Move a block by one row (-1 up, +1 down). Appends to the same column
   * index in the target row, clamped to the row's column count. */
  function moveBlockVertical(blockId: string, direction: -1 | 1) {
    setRows((rows) => {
      const loc = findLocationOfBlock(rows, blockId);
      if (!loc) return rows;
      const toRow = loc.row + direction;
      if (toRow < 0 || toRow >= rows.length) return rows;
      const item = rows[loc.row].columns[loc.col].find((b) => b.id === blockId);
      if (!item) return rows;
      const targetColCount = rows[toRow].columns.length;
      if (targetColCount === 0) return rows;
      const targetCol = Math.min(loc.col, targetColCount - 1);
      return rows.map((r, ri) => {
        if (ri === loc.row) {
          return {
            ...r,
            columns: r.columns.map((c, ci) =>
              ci === loc.col ? c.filter((b) => b.id !== blockId) : c
            ),
          };
        }
        if (ri === toRow) {
          return {
            ...r,
            columns: r.columns.map((c, ci) =>
              ci === targetCol ? [...c, item] : c
            ),
          };
        }
        return r;
      });
    });
  }

  /** Fold a column-level block into an adjacent inline-row sibling, or wrap
   * it in a brand-new inline-row when no adjacent sibling exists. Lets users
   * convert a vertical stack into a horizontal row without rebuilding each
   * block from scratch. */
  function wrapBlockInRow(blockId: string) {
    setRows((rows) => {
      const loc = findLocationOfBlock(rows, blockId);
      if (!loc) return rows;
      const column = rows[loc.row].columns[loc.col];
      const block = column[loc.index];
      // Wrapping an inline-row block in another inline-row would create a
      // nested structure we don't support. No-op so the user sees nothing
      // happen instead of a confusing error.
      if (!block || block.type === "inlineRow") return rows;

      const prev = loc.index > 0 ? column[loc.index - 1] : null;
      const next = loc.index < column.length - 1 ? column[loc.index + 1] : null;

      let nextColumn: FooterBlock[];
      if (prev && prev.type === "inlineRow") {
        // Append the leaf to the previous inline row's children.
        nextColumn = column
          .filter((b) => b.id !== blockId)
          .map((b) =>
            b.id === prev.id
              ? { ...prev, children: [...prev.children, block as FooterLeafBlock] }
              : b
          );
      } else if (next && next.type === "inlineRow") {
        // Prepend the leaf to the next inline row's children.
        nextColumn = column
          .filter((b) => b.id !== blockId)
          .map((b) =>
            b.id === next.id
              ? { ...next, children: [block as FooterLeafBlock, ...next.children] }
              : b
          );
      } else {
        // No adjacent row — wrap the block in a fresh inline-row in place.
        const wrapper = makeInlineRowBlock({
          align: block.align,
          children: [block as FooterLeafBlock],
        });
        nextColumn = column.map((b) => (b.id === blockId ? wrapper : b));
      }

      return rows.map((r, ri) =>
        ri === loc.row
          ? {
              ...r,
              columns: r.columns.map((c, ci) => (ci === loc.col ? nextColumn : c)),
            }
          : r
      );
    });
  }

  /** Mutate the children list of a specific inline-row block in place. All
   * row-child operations (add/remove/move/update) funnel through here so the
   * traversal logic exists in exactly one spot. */
  function updateInlineRowChildren(
    parentBlockId: string,
    childrenUpdater: (children: FooterLeafBlock[]) => FooterLeafBlock[]
  ) {
    setRows((rows) =>
      rows.map((row) => ({
        ...row,
        columns: row.columns.map((col) =>
          col.map((b) =>
            b.id === parentBlockId && b.type === "inlineRow"
              ? { ...b, children: childrenUpdater(b.children) }
              : b
          )
        ),
      }))
    );
  }

  function addInlineRowChild(parentBlockId: string, type: FooterLeafBlockType) {
    updateInlineRowChildren(parentBlockId, (children) => [
      ...children,
      makeFooterLeafBlock(type),
    ]);
  }

  function updateInlineRowChild(
    parentBlockId: string,
    childId: string,
    updater: (b: FooterLeafBlock) => FooterLeafBlock
  ) {
    updateInlineRowChildren(parentBlockId, (children) =>
      children.map((c) => (c.id === childId ? updater(c) : c))
    );
  }

  function removeInlineRowChild(parentBlockId: string, childId: string) {
    updateInlineRowChildren(parentBlockId, (children) =>
      children.filter((c) => c.id !== childId)
    );
  }

  function moveInlineRowChild(
    parentBlockId: string,
    childId: string,
    direction: -1 | 1
  ) {
    updateInlineRowChildren(parentBlockId, (children) => {
      const idx = children.findIndex((c) => c.id === childId);
      if (idx === -1) return children;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= children.length) return children;
      return arrayMove(children, idx, targetIdx);
    });
  }

  /** Lift a child out of its inline row so it becomes a sibling of the row
   * block in the same column (inserted right after the row block). The
   * inverse of `wrapBlockInRow`. */
  function popOutInlineRowChild(parentBlockId: string, childId: string) {
    setRows((rows) =>
      rows.map((row) => ({
        ...row,
        columns: row.columns.map((col) => {
          const parentIdx = col.findIndex(
            (b) => b.id === parentBlockId && b.type === "inlineRow"
          );
          if (parentIdx === -1) return col;
          const parent = col[parentIdx] as FooterInlineRowBlock;
          const child = parent.children.find((c) => c.id === childId);
          if (!child) return col;
          const nextParent: FooterInlineRowBlock = {
            ...parent,
            children: parent.children.filter((c) => c.id !== childId),
          };
          const nextCol = [...col];
          nextCol.splice(parentIdx, 1, nextParent);
          nextCol.splice(parentIdx + 1, 0, child);
          return nextCol;
        }),
      }))
    );
  }

  function updateInlineRowMeta(
    parentBlockId: string,
    patch: Partial<Pick<FooterInlineRowBlock, "gap" | "wrap" | "verticalAlign">>
  ) {
    setRows((rows) =>
      rows.map((row) => ({
        ...row,
        columns: row.columns.map((col) =>
          col.map((b) =>
            b.id === parentBlockId && b.type === "inlineRow" ? { ...b, ...patch } : b
          )
        ),
      }))
    );
  }

  function setColumnCount(rowIndex: number, nextCount: number) {
    const target = Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, Math.floor(nextCount)));
    setRows((rows) =>
      rows.map((row, ri) => {
        if (ri !== rowIndex) return row;
        const current = row.columns.length;
        if (target === current) return row;
        if (target > current) {
          const extras = Array.from(
            { length: target - current },
            () => [] as FooterBlock[]
          );
          // New columns get the neutral default weight so the row stays
          // visually balanced until the user dials in custom widths.
          const weightExtras = Array.from(
            { length: target - current },
            () => FOOTER_COLUMN_WEIGHT_DEFAULT
          );
          return {
            ...row,
            columns: [...row.columns, ...extras],
            columnWeights: [...row.columnWeights, ...weightExtras],
          };
        }
        // Shrinking: collapse trailing columns into the new last column so
        // we never silently drop the user's blocks. Weights for the dropped
        // columns are simply discarded — there's no meaningful way to merge
        // them into the kept column's weight.
        const kept = row.columns.slice(0, target).map((c) => [...c]);
        const dropped = row.columns.slice(target).flat();
        if (dropped.length > 0) {
          kept[target - 1] = [...kept[target - 1], ...dropped];
        }
        return {
          ...row,
          columns: kept,
          columnWeights: row.columnWeights.slice(0, target),
        };
      })
    );
  }

  function setColumnWeight(rowIndex: number, columnIndex: number, nextWeight: number) {
    setRows((rows) =>
      rows.map((row, ri) => {
        if (ri !== rowIndex) return row;
        if (columnIndex < 0 || columnIndex >= row.columnWeights.length) return row;
        const nextWeights = row.columnWeights.slice();
        nextWeights[columnIndex] = sanitizeWeight(nextWeight);
        return { ...row, columnWeights: nextWeights };
      })
    );
  }

  function setRowWrap(rowIndex: number, nextWrap: boolean) {
    setRows((rows) =>
      rows.map((row, ri) => (ri === rowIndex ? { ...row, wrap: nextWrap } : row))
    );
  }

  function addRow() {
    setRows((rows) => {
      if (rows.length >= MAX_ROWS) return rows;
      return [...rows, makeFooterRow({ columns: [[]] })];
    });
  }

  /** Delete a row, collapsing its blocks into the previous row's columns so
   * the user never silently loses content. If it's the very first row, the
   * blocks fold into the next row instead. Disabled at MIN_ROWS in the UI. */
  function removeRow(rowIndex: number) {
    setRows((rows) => {
      if (rows.length <= MIN_ROWS) return rows;
      const merging = rows[rowIndex];
      const mergeBlocks = merging.columns.flat();
      const nextRows = rows.filter((_, ri) => ri !== rowIndex);
      if (mergeBlocks.length === 0) return nextRows;
      const targetIdx = rowIndex > 0 ? rowIndex - 1 : 0;
      const target = nextRows[targetIdx];
      const lastColIdx = Math.max(target.columns.length - 1, 0);
      const nextCols = target.columns.map((c) => [...c]);
      if (nextCols.length === 0) {
        nextCols.push(mergeBlocks);
      } else {
        nextCols[lastColIdx] = [...nextCols[lastColIdx], ...mergeBlocks];
      }
      return nextRows.map((r, ri) =>
        ri === targetIdx ? { ...r, columns: nextCols } : r
      );
    });
  }

  function moveRow(rowIndex: number, direction: -1 | 1) {
    setRows((rows) => {
      const target = rowIndex + direction;
      if (target < 0 || target >= rows.length) return rows;
      return arrayMove(rows, rowIndex, target);
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setRows((rows) => {
      const source = findLocationOfBlock(rows, activeId);
      if (!source) return rows;

      // Resolve the drop target into a (row, col, index) coordinate. The
      // `over` can be either a column droppable (empty slot/column body) or
      // another block sortable item.
      let target: BlockLocation;
      const overCol = parseColumnDroppableId(overId);
      if (overCol) {
        if (
          overCol.row < 0 ||
          overCol.row >= rows.length ||
          overCol.col < 0 ||
          overCol.col >= rows[overCol.row].columns.length
        ) {
          return rows;
        }
        target = {
          row: overCol.row,
          col: overCol.col,
          index: rows[overCol.row].columns[overCol.col].length,
        };
      } else {
        const overLoc = findLocationOfBlock(rows, overId);
        if (!overLoc) return rows;
        target = overLoc;
      }

      // Same-column reorders are handled in dragEnd so the live state stays
      // stable for the SortableContext's auto-animation. Cross-column /
      // cross-row moves happen here so the empty/highlighted column slot
      // updates as the user drags.
      if (target.row === source.row && target.col === source.col) return rows;

      const item = rows[source.row].columns[source.col].find(
        (b) => b.id === activeId
      );
      if (!item) return rows;

      return rows.map((row, ri) => {
        if (ri !== source.row && ri !== target.row) return row;
        const nextCols = row.columns.map((c, ci) => {
          if (ri === source.row && ci === source.col) {
            return c.filter((b) => b.id !== activeId);
          }
          if (ri === target.row && ci === target.col) {
            const insertAt = Math.min(target.index, c.length);
            const copy = [...c];
            copy.splice(insertAt, 0, item);
            return copy;
          }
          return c;
        });
        return { ...row, columns: nextCols };
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setRows((rows) => {
      const source = findLocationOfBlock(rows, activeId);
      if (!source) return rows;
      // Cross-column / cross-row drops already settled in dragOver.
      if (parseColumnDroppableId(overId)) return rows;

      const target = findLocationOfBlock(rows, overId);
      if (!target) return rows;
      if (target.row !== source.row || target.col !== source.col) return rows;

      const col = rows[source.row].columns[source.col];
      const oldIdx = col.findIndex((b) => b.id === activeId);
      const newIdx = col.findIndex((b) => b.id === overId);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return rows;

      return rows.map((row, ri) => {
        if (ri !== source.row) return row;
        return {
          ...row,
          columns: row.columns.map((c, ci) =>
            ci === source.col ? arrayMove(c, oldIdx, newIdx) : c
          ),
        };
      });
    });
  }

  function handleSave() {
    setError(null);
    setSavedFlash(false);
    start(async () => {
      const result = await saveSiteFooter(footer);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    });
  }

  const activeBlock = useMemo(() => {
    if (!activeDragId) return null;
    for (const row of footer.rows) {
      for (const col of row.columns) {
        const found = col.find((b) => b.id === activeDragId);
        if (found) return found;
      }
    }
    return null;
  }, [activeDragId, footer.rows]);

  const rowCount = footer.rows.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Footer</CardTitle>
        <p className="text-sm text-muted-foreground">
          Build the public footer from rows of columns. Each row picks its own
          column count; drag blocks between columns and rows to rearrange.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormSection title="Appearance">
          <ColorField
            label="Background"
            value={footer.backgroundColor}
            onChange={(v) => setColorField("backgroundColor", v)}
          />
          <ColorField
            label="Text"
            value={footer.textColor}
            onChange={(v) => setColorField("textColor", v)}
          />
          <ColorField
            label="Link"
            value={footer.linkColor}
            onChange={(v) => setColorField("linkColor", v)}
          />
          <ColorField
            label="Link hover"
            value={footer.linkHoverColor}
            onChange={(v) => setColorField("linkHoverColor", v)}
          />
        </FormSection>

        <FormSection title="Layout & spacing">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ft-rowspacing">Row spacing (px)</Label>
              <Input
                id="ft-rowspacing"
                type="number"
                min={0}
                max={128}
                value={footer.style.rowSpacing}
                onChange={(e) => setStyleField("rowSpacing", Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Gap between rows.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ft-colgap">Column gap (px)</Label>
              <Input
                id="ft-colgap"
                type="number"
                min={0}
                max={128}
                value={footer.style.columnGap}
                onChange={(e) => setStyleField("columnGap", Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ft-rowgap">Block gap (px)</Label>
              <Input
                id="ft-rowgap"
                type="number"
                min={0}
                max={128}
                value={footer.style.rowGap}
                onChange={(e) => setStyleField("rowGap", Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Vertical gap between stacked blocks inside a column.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ft-linkgap">Link spacing (px)</Label>
              <Input
                id="ft-linkgap"
                type="number"
                min={0}
                max={48}
                value={footer.style.linkSpacing}
                onChange={(e) => setStyleField("linkSpacing", Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ft-vpad">Vertical padding (px)</Label>
              <Input
                id="ft-vpad"
                type="number"
                min={0}
                max={200}
                value={footer.style.verticalPadding}
                onChange={(e) =>
                  setStyleField("verticalPadding", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ft-hpad">Horizontal padding (px)</Label>
              <Input
                id="ft-hpad"
                type="number"
                min={0}
                max={200}
                value={footer.style.horizontalPadding}
                onChange={(e) =>
                  setStyleField("horizontalPadding", Number(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </FormSection>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Rows</Label>
            <p className="text-xs text-muted-foreground">
              Drag blocks between columns and across rows. Use the arrows for
              keyboard movement.
            </p>
          </div>
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveDragId(null)}
          >
            <div className="space-y-4">
              {footer.rows.map((row, ri) => (
                <FooterRowEditor
                  key={row.id}
                  row={row}
                  rowIndex={ri}
                  rowCount={rowCount}
                  onAddBlock={(ci, type) => addBlock(ri, ci, type)}
                  onUpdateBlock={(ci, blockId, updater) =>
                    updateBlock(ri, ci, blockId, updater)
                  }
                  onRemoveBlock={(ci, blockId) => removeBlock(ri, ci, blockId)}
                  onMoveBlockHorizontal={(blockId, direction) =>
                    moveBlockHorizontal(blockId, direction)
                  }
                  onMoveBlockVertical={(blockId, direction) =>
                    moveBlockVertical(blockId, direction)
                  }
                  onWrapBlockInRow={wrapBlockInRow}
                  inlineRowOps={{
                    add: addInlineRowChild,
                    update: updateInlineRowChild,
                    remove: removeInlineRowChild,
                    move: moveInlineRowChild,
                    popOut: popOutInlineRowChild,
                    updateMeta: updateInlineRowMeta,
                  }}
                  onSetColumnCount={(nextCount) => setColumnCount(ri, nextCount)}
                  onSetColumnWeight={(ci, weight) => setColumnWeight(ri, ci, weight)}
                  onSetWrap={(wrap) => setRowWrap(ri, wrap)}
                  onRemoveRow={() => removeRow(ri)}
                  onMoveRowUp={() => moveRow(ri, -1)}
                  onMoveRowDown={() => moveRow(ri, 1)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeBlock ? (
                <div className="rounded-lg border bg-card p-3 shadow-lg">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {blockTypeLabel(activeBlock.type)}
                  </p>
                  <p className="text-sm font-medium">{blockSummary(activeBlock)}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addRow}
              disabled={rowCount >= MAX_ROWS}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add row
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save footer
          </Button>
          {savedFlash && (
            <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
              Saved
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Bundled inline-row child operations. All ops accept the parent (inline
 * row) block id plus a child id so they can be threaded down through column
 * editors without exploding the prop count. Lives at the FooterCard level
 * because all mutations funnel through the same `setRows` state.
 */
interface InlineRowOps {
  add: (parentBlockId: string, type: FooterLeafBlockType) => void;
  update: (
    parentBlockId: string,
    childId: string,
    updater: (b: FooterLeafBlock) => FooterLeafBlock
  ) => void;
  remove: (parentBlockId: string, childId: string) => void;
  move: (parentBlockId: string, childId: string, direction: -1 | 1) => void;
  popOut: (parentBlockId: string, childId: string) => void;
  updateMeta: (
    parentBlockId: string,
    patch: Partial<Pick<FooterInlineRowBlock, "gap" | "wrap" | "verticalAlign">>
  ) => void;
}

interface FooterRowEditorProps {
  row: FooterRow;
  rowIndex: number;
  rowCount: number;
  onAddBlock: (columnIndex: number, type: FooterBlockType) => void;
  onUpdateBlock: (
    columnIndex: number,
    blockId: string,
    updater: (b: FooterBlock) => FooterBlock
  ) => void;
  onRemoveBlock: (columnIndex: number, blockId: string) => void;
  onMoveBlockHorizontal: (blockId: string, direction: -1 | 1) => void;
  onMoveBlockVertical: (blockId: string, direction: -1 | 1) => void;
  onWrapBlockInRow: (blockId: string) => void;
  inlineRowOps: InlineRowOps;
  onSetColumnCount: (nextCount: number) => void;
  onSetColumnWeight: (columnIndex: number, weight: number) => void;
  onSetWrap: (wrap: boolean) => void;
  onRemoveRow: () => void;
  onMoveRowUp: () => void;
  onMoveRowDown: () => void;
}

function FooterRowEditor({
  row,
  rowIndex,
  rowCount,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlockHorizontal,
  onMoveBlockVertical,
  onWrapBlockInRow,
  inlineRowOps,
  onSetColumnCount,
  onSetColumnWeight,
  onSetWrap,
  onRemoveRow,
  onMoveRowUp,
  onMoveRowDown,
}: FooterRowEditorProps) {
  const columnCount = row.columns.length;
  const canDelete = rowCount > MIN_ROWS;

  return (
    <div className="rounded-xl border border-border bg-background/50 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Row {rowIndex + 1}</p>
          <div className="inline-flex overflow-hidden rounded-md border border-input">
            <button
              type="button"
              onClick={onMoveRowUp}
              disabled={rowIndex === 0}
              className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-30"
              aria-label="Move row up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveRowDown}
              disabled={rowIndex === rowCount - 1}
              className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-30"
              aria-label="Move row down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground" htmlFor={`ft-colcount-${rowIndex}`}>
            Columns
          </Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onSetColumnCount(columnCount - 1)}
              disabled={columnCount <= MIN_COLUMNS}
              aria-label={`Row ${rowIndex + 1}: decrease column count`}
            >
              −
            </Button>
            <Input
              id={`ft-colcount-${rowIndex}`}
              type="number"
              min={MIN_COLUMNS}
              max={MAX_COLUMNS}
              value={columnCount}
              onChange={(e) =>
                onSetColumnCount(Number(e.target.value) || MIN_COLUMNS)
              }
              className="h-8 w-14 text-center text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onSetColumnCount(columnCount + 1)}
              disabled={columnCount >= MAX_COLUMNS}
              aria-label={`Row ${rowIndex + 1}: increase column count`}
            >
              +
            </Button>
          </div>
          <label
            className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground"
            title="When on, columns wrap to a new line on narrower screens. Turn off to keep them strictly side-by-side at every viewport (they will shrink instead)."
          >
            <input
              type="checkbox"
              checked={row.wrap}
              onChange={(e) => onSetWrap(e.target.checked)}
              aria-label={`Row ${rowIndex + 1}: wrap columns on narrow screens`}
            />
            <span>Wrap</span>
          </label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRemoveRow}
            disabled={!canDelete}
            aria-label={`Delete row ${rowIndex + 1}`}
            title={canDelete ? "Delete row (blocks fold into previous row)" : "At least one row required"}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div
        className="grid gap-3 overflow-x-auto"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(220px, 1fr))`,
        }}
      >
        {row.columns.map((columnBlocks, ci) => (
          <FooterColumnEditor
            key={ci}
            rowIndex={rowIndex}
            columnIndex={ci}
            columnCount={columnCount}
            rowCount={rowCount}
            blocks={columnBlocks}
            weight={row.columnWeights[ci] ?? FOOTER_COLUMN_WEIGHT_DEFAULT}
            onSetWeight={(weight) => onSetColumnWeight(ci, weight)}
            onAddBlock={(type) => onAddBlock(ci, type)}
            onUpdateBlock={(blockId, updater) => onUpdateBlock(ci, blockId, updater)}
            onRemoveBlock={(blockId) => onRemoveBlock(ci, blockId)}
            onMoveBlockHorizontal={onMoveBlockHorizontal}
            onMoveBlockVertical={onMoveBlockVertical}
            onWrapBlockInRow={onWrapBlockInRow}
            inlineRowOps={inlineRowOps}
          />
        ))}
      </div>
    </div>
  );
}

interface FooterColumnEditorProps {
  rowIndex: number;
  columnIndex: number;
  columnCount: number;
  rowCount: number;
  blocks: FooterBlock[];
  /** Per-column fr-weight; `1` = equal share with other `1`-weighted columns. */
  weight: number;
  onSetWeight: (weight: number) => void;
  onAddBlock: (type: FooterBlockType) => void;
  onUpdateBlock: (blockId: string, updater: (b: FooterBlock) => FooterBlock) => void;
  onRemoveBlock: (blockId: string) => void;
  onMoveBlockHorizontal: (blockId: string, direction: -1 | 1) => void;
  onMoveBlockVertical: (blockId: string, direction: -1 | 1) => void;
  onWrapBlockInRow: (blockId: string) => void;
  inlineRowOps: InlineRowOps;
}

function FooterColumnEditor({
  rowIndex,
  columnIndex,
  columnCount,
  rowCount,
  blocks,
  weight,
  onSetWeight,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlockHorizontal,
  onMoveBlockVertical,
  onWrapBlockInRow,
  inlineRowOps,
}: FooterColumnEditorProps) {
  const droppableId = columnDroppableId(rowIndex, columnIndex);
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const weightId = useId();

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border bg-muted/20 p-2 transition-colors ${
        isOver ? "border-primary bg-muted/40" : "border-border"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-1 px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Column {columnIndex + 1}
        </p>
        <AddBlockMenu
          ariaLabel={`Add block to row ${rowIndex + 1}, column ${columnIndex + 1}`}
          options={BLOCK_TYPE_OPTIONS}
          onAdd={(type) => onAddBlock(type as FooterBlockType)}
        />
      </div>
      <div className="mb-2 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
        <label htmlFor={weightId} className="cursor-pointer">
          Width
        </label>
        <Input
          id={weightId}
          type="number"
          min={0.1}
          step={0.1}
          value={weight}
          onChange={(e) => onSetWeight(Number(e.target.value))}
          className="h-7 w-16 text-xs"
          aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1} width weight`}
          title="Relative width. A column with weight 2 takes twice the space of a weight-1 column in the same row."
        />
        <span>fr</span>
      </div>
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {blocks.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
              Drag a block here, or click + to add one.
            </div>
          ) : (
            blocks.map((block) => (
              <SortableBlockCard
                key={block.id}
                block={block}
                columnIndex={columnIndex}
                canMoveLeft={columnIndex > 0}
                canMoveRight={columnIndex < columnCount - 1}
                canMoveUp={rowIndex > 0}
                canMoveDown={rowIndex < rowCount - 1}
                onUpdate={(updater) => onUpdateBlock(block.id, updater)}
                onRemove={() => onRemoveBlock(block.id)}
                onMoveLeft={() => onMoveBlockHorizontal(block.id, -1)}
                onMoveRight={() => onMoveBlockHorizontal(block.id, 1)}
                onMoveUp={() => onMoveBlockVertical(block.id, -1)}
                onMoveDown={() => onMoveBlockVertical(block.id, 1)}
                onWrapInRow={() => onWrapBlockInRow(block.id)}
                inlineRowOps={inlineRowOps}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface AddBlockMenuProps<T extends string> {
  /** Accessible label for the trigger button. */
  ariaLabel: string;
  /** Menu items rendered in order. */
  options: { value: T; label: string; icon: typeof ListIcon }[];
  /** Invoked with the selected option's value when an item is clicked. */
  onAdd: (type: T) => void;
}

function AddBlockMenu<T extends string>({
  ariaLabel,
  options,
  onAdd,
}: AddBlockMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // Portal rendering requires `document`. We can't render during SSR, but
  // since the popover is gated by `open` (which starts false) the SSR pass
  // never reaches the portal call anyway. The typeof guard below makes that
  // explicit for any future code path that flips `open` before hydration.

  // The popover is rendered into document.body via a portal (see below) so
  // it escapes the row's `overflow-x-auto` container, which would otherwise
  // clip the menu on the right edge. We use fixed positioning anchored to
  // the trigger button's bounding rect and recompute on resize/scroll.
  useEffect(() => {
    if (!open) return;
    function reposition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth ?? 180;
      // Anchor the menu's right edge to the trigger's right edge so it grows
      // leftward, then clamp into the viewport with an 8px gutter.
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      const maxLeft = window.innerWidth - menuWidth - 8;
      if (left > maxLeft) left = maxLeft;
      setPosition({ top: rect.bottom + 4, left });
    }
    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  // Close on outside click using a window listener. We attach when the menu
  // opens and detach on close to avoid noise. The menu itself is matched by
  // data-attr so clicks inside the portal-rendered menu don't dismiss it.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(`[data-add-block-menu="${menuId}"]`)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, menuId]);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        data-add-block-menu={menuId}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              data-add-block-menu={menuId}
              className="fixed z-[9999] min-w-[180px] overflow-hidden rounded-md border border-border bg-card text-card-foreground text-sm shadow-lg"
              style={{ top: position.top, left: position.left }}
            >
              {options.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onAdd(value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{label}</span>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

interface SortableBlockCardProps {
  block: FooterBlock;
  columnIndex: number;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpdate: (updater: (b: FooterBlock) => FooterBlock) => void;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onWrapInRow: () => void;
  inlineRowOps: InlineRowOps;
}

function SortableBlockCard({
  block,
  columnIndex,
  canMoveLeft,
  canMoveRight,
  canMoveUp,
  canMoveDown,
  onUpdate,
  onRemove,
  onMoveLeft,
  onMoveRight,
  onMoveUp,
  onMoveDown,
  onWrapInRow,
  inlineRowOps,
}: SortableBlockCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  // Switching the block type preserves id + align and reseeds the body via the
  // matching factory. We can't carry over fields between variants because they
  // don't overlap (links vs src+alt+href), so the body resets cleanly.
  function switchType(nextType: FooterBlockType) {
    if (nextType === block.type) return;
    onUpdate((b) => makeFooterBlock(nextType, { id: b.id, align: b.align }));
  }

  function setAlign(align: FooterBlockAlign) {
    onUpdate((b) => ({ ...b, align }));
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="space-y-2 rounded-md border bg-card p-2"
      {...attributes}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag block ${blockSummary(block)}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <select
          aria-label="Block type"
          value={block.type}
          onChange={(e) => switchType(e.target.value as FooterBlockType)}
          className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
        >
          {BLOCK_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={!canMoveLeft}
          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Move block to previous column"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={!canMoveRight}
          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Move block to next column"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Move block to previous row"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Move block to next row"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {block.type !== "inlineRow" && (
          <button
            type="button"
            onClick={onWrapInRow}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Wrap block in an inline row (or merge into adjacent row)"
            title="Wrap in inline row — merges into an adjacent inline-row sibling when one exists"
          >
            <Rows3 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-muted-foreground hover:text-destructive"
          aria-label="Remove block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <AlignToggle value={block.align} onChange={setAlign} />

      {block.type === "linkList" ? (
        <LinkListBlockBody
          block={block}
          columnIndex={columnIndex}
          onChange={(patch) => onUpdate((b) => ({ ...(b as FooterLinkListBlock), ...patch }))}
        />
      ) : block.type === "image" ? (
        <ImageBlockBody
          block={block}
          onChange={(patch) => onUpdate((b) => ({ ...(b as FooterImageBlock), ...patch }))}
        />
      ) : block.type === "imageLink" ? (
        <ImageLinkBlockBody
          block={block}
          onChange={(patch) =>
            onUpdate((b) => ({ ...(b as FooterImageLinkBlock), ...patch }))
          }
        />
      ) : block.type === "text" ? (
        <TextBlockBody
          block={block}
          onChange={(patch) => onUpdate((b) => ({ ...(b as FooterTextBlock), ...patch }))}
        />
      ) : block.type === "copyright" ? (
        <CopyrightBlockBody
          block={block}
          onChange={(patch) =>
            onUpdate((b) => ({ ...(b as FooterCopyrightBlock), ...patch }))
          }
        />
      ) : block.type === "social" ? (
        <SocialBlockBody
          block={block}
          onChange={(patch) =>
            onUpdate((b) => ({ ...(b as FooterSocialBlock), ...patch }))
          }
        />
      ) : (
        <InlineRowBlockBody block={block} inlineRowOps={inlineRowOps} />
      )}
    </div>
  );
}

function AlignToggle({
  value,
  onChange,
}: {
  value: FooterBlockAlign;
  onChange: (next: FooterBlockAlign) => void;
}) {
  const options: { value: FooterBlockAlign; icon: typeof AlignLeft; label: string }[] = [
    { value: "left", icon: AlignLeft, label: "Align left" },
    { value: "center", icon: AlignCenter, label: "Align center" },
    { value: "right", icon: AlignRight, label: "Align right" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Block alignment"
      className="inline-flex overflow-hidden rounded-md border border-input"
    >
      {options.map(({ value: optValue, icon: Icon, label }) => {
        const active = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => onChange(optValue)}
            className={`flex h-7 w-8 items-center justify-center transition ${
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

function VerticalAlignToggle({
  value,
  onChange,
}: {
  value: FooterInlineRowVerticalAlign;
  onChange: (next: FooterInlineRowVerticalAlign) => void;
}) {
  const options: {
    value: FooterInlineRowVerticalAlign;
    icon: typeof AlignStartHorizontal;
    label: string;
  }[] = [
    { value: "top", icon: AlignStartHorizontal, label: "Align children to top" },
    { value: "center", icon: AlignCenterHorizontal, label: "Center children vertically" },
    { value: "bottom", icon: AlignEndHorizontal, label: "Align children to bottom" },
    { value: "stretch", icon: StretchHorizontal, label: "Stretch children to fill height" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Inline row vertical alignment"
      className="inline-flex overflow-hidden rounded-md border border-input"
    >
      {options.map(({ value: optValue, icon: Icon, label }) => {
        const active = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(optValue)}
            className={`flex h-7 w-8 items-center justify-center transition ${
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

function LinkListBlockBody({
  block,
  columnIndex,
  onChange,
}: {
  block: FooterLinkListBlock;
  columnIndex: number;
  onChange: (patch: Partial<FooterLinkListBlock>) => void;
}) {
  return (
    <div className="space-y-2">
      <Input
        aria-label={`Column ${columnIndex + 1} list title`}
        value={block.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Heading"
        className="h-8 text-sm"
      />
      <Textarea
        aria-label={`Column ${columnIndex + 1} list links`}
        value={block.links}
        onChange={(e) => onChange({ links: e.target.value })}
        rows={3}
        placeholder="Label|/href per line"
        className="text-sm"
      />
    </div>
  );
}

function ImageBlockBody({
  block,
  onChange,
}: {
  block: FooterImageBlock;
  onChange: (patch: Partial<FooterImageBlock>) => void;
}) {
  return (
    <div className="space-y-2">
      <ImageSrcField
        src={block.src}
        onChange={(src) => onChange({ src })}
        placeholderLabel="Image"
      />
      <Input
        aria-label="Image alt text"
        value={block.alt}
        onChange={(e) => onChange({ alt: e.target.value })}
        placeholder="Alt text"
        className="h-8 text-sm"
      />
      <ImageSizeFields
        maxWidth={block.maxWidth}
        maxHeight={block.maxHeight}
        onChange={(patch) => onChange(patch)}
      />
    </div>
  );
}

function ImageLinkBlockBody({
  block,
  onChange,
}: {
  block: FooterImageLinkBlock;
  onChange: (patch: Partial<FooterImageLinkBlock>) => void;
}) {
  return (
    <div className="space-y-2">
      <ImageSrcField
        src={block.src}
        onChange={(src) => onChange({ src })}
        placeholderLabel="Image"
      />
      <Input
        aria-label="Image alt text"
        value={block.alt}
        onChange={(e) => onChange({ alt: e.target.value })}
        placeholder="Alt text"
        className="h-8 text-sm"
      />
      <Input
        aria-label="Image link href"
        value={block.href}
        onChange={(e) => onChange({ href: e.target.value })}
        placeholder="Link href (e.g. /about or https://…)"
        className="h-8 text-sm"
      />
      <ImageSizeFields
        maxWidth={block.maxWidth}
        maxHeight={block.maxHeight}
        onChange={(patch) => onChange(patch)}
      />
    </div>
  );
}

function TextBlockBody({
  block,
  onChange,
}: {
  block: FooterTextBlock;
  onChange: (patch: Partial<FooterTextBlock>) => void;
}) {
  // "Override color" toggle: off → empty string sentinel that tells the
  // renderer to inherit the footer's text color. On → expose the standard
  // ColorField so theme tokens and custom hex both work like elsewhere.
  //
  // Coalesce undefined/null to "" so legacy text blocks that pre-date the
  // `color` field default to "inherit" instead of slipping into the
  // override branch and feeding `undefined` to ColorField.
  const blockColor = typeof block.color === "string" ? block.color : "";
  const blockFontSize =
    typeof block.fontSize === "number" && block.fontSize > 0 ? block.fontSize : 14;
  const colorOverride = blockColor !== "";
  function setColorOverride(next: boolean) {
    if (next === colorOverride) return;
    // Seed with the page foreground theme token so the user immediately sees
    // a sensible swatch; they can switch to Custom from there.
    onChange({ color: next ? "theme:foreground" : "" });
  }

  // Bridge legacy plain-text bodies (saved before the WYSIWYG upgrade) into
  // HTML for the editor. Idempotent — once a block has been saved as HTML,
  // this becomes a pass-through.
  const bodyHtml = legacyTextToHtml(block.body || "");

  return (
    <div className="space-y-2">
      <Input
        aria-label="Text heading"
        value={block.heading}
        onChange={(e) => onChange({ heading: e.target.value })}
        placeholder="Heading (optional)"
        className="h-8 text-sm"
      />
      <div aria-label="Text body" className="text-sm">
        <WysiwygFieldRender
          id={`ft-text-body-${block.id}`}
          value={bodyHtml}
          onChange={(v) => onChange({ body: v })}
          minHeight="120px"
          placeholder="Body text — use the link button to add mailto: or tel: links"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`ft-text-size-${block.id}`} className="text-xs text-muted-foreground">
          Font size
        </Label>
        <Input
          id={`ft-text-size-${block.id}`}
          type="number"
          min={8}
          max={96}
          value={blockFontSize}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange({ fontSize: Number.isFinite(n) && n > 0 ? Math.floor(n) : 14 });
          }}
          className="h-7 w-16 text-xs"
        />
        <span className="text-xs text-muted-foreground">px</span>
        <span className="text-xs text-muted-foreground/70" title="Heading scales to 1.25× the body size">
          (heading scales auto)
        </span>
      </div>
      <div className="space-y-1">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={colorOverride}
            onChange={(e) => setColorOverride(e.target.checked)}
          />
          <span>Override text color</span>
        </label>
        {colorOverride && (
          <ColorField
            label="Color"
            value={blockColor}
            onChange={(v) => onChange({ color: v })}
          />
        )}
      </div>
    </div>
  );
}

function CopyrightBlockBody({
  block,
  onChange,
}: {
  block: FooterCopyrightBlock;
  onChange: (patch: Partial<FooterCopyrightBlock>) => void;
}) {
  return (
    <div className="space-y-1">
      <Input
        aria-label="Copyright text"
        value={block.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="© {year} My Company"
        className="h-8 text-sm"
      />
      <p className="text-[10px] text-muted-foreground">
        Use <code>{"{year}"}</code> to insert the current year.
      </p>
    </div>
  );
}

function SocialBlockBody({
  block,
  onChange,
}: {
  block: FooterSocialBlock;
  onChange: (patch: Partial<FooterSocialBlock>) => void;
}) {
  return (
    <div className="space-y-1">
      <Textarea
        aria-label="Social links"
        value={block.links}
        onChange={(e) => onChange({ links: e.target.value })}
        rows={3}
        placeholder="facebook|https://facebook.com"
        className="text-sm"
      />
      <p className="text-[10px] text-muted-foreground">
        One per line, formatted as <code>platform|https://…</code>. Renders as
        an icon. Known platforms: facebook, instagram, twitter, x, linkedin,
        youtube, tiktok, github, pinterest, snapchat, whatsapp, zillow. Anything else
        falls back to a generic globe icon.
      </p>
    </div>
  );
}

function InlineRowBlockBody({
  block,
  inlineRowOps,
}: {
  block: FooterInlineRowBlock;
  inlineRowOps: InlineRowOps;
}) {
  const { add, update, remove, move, popOut, updateMeta } = inlineRowOps;
  return (
    <div className="space-y-2 rounded-md border border-dashed bg-muted/30 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Gap</span>
            <Input
              type="number"
              min={0}
              max={64}
              value={block.gap}
              onChange={(e) =>
                updateMeta(block.id, { gap: Math.max(0, Number(e.target.value) || 0) })
              }
              className="h-7 w-14 text-xs"
              aria-label="Inline row gap (px)"
            />
            <span>px</span>
          </label>
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={block.wrap}
              onChange={(e) => updateMeta(block.id, { wrap: e.target.checked })}
              aria-label="Wrap children to next line when needed"
            />
            <span>Wrap</span>
          </label>
          <VerticalAlignToggle
            value={block.verticalAlign}
            onChange={(verticalAlign) => updateMeta(block.id, { verticalAlign })}
          />
        </div>
        <AddBlockMenu
          ariaLabel={`Add block to inline row ${blockSummary(block)}`}
          options={LEAF_BLOCK_TYPE_OPTIONS}
          onAdd={(type) => add(block.id, type as FooterLeafBlockType)}
        />
      </div>
      {block.children.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center text-[11px] text-muted-foreground">
          Empty inline row — click + to add a block, or use the &ldquo;wrap&rdquo;
          button on an adjacent block in this column to fold it into this row.
        </div>
      ) : (
        <div className="space-y-2">
          {block.children.map((child, idx) => (
            <InlineRowChildCard
              key={child.id}
              child={child}
              canMoveLeft={idx > 0}
              canMoveRight={idx < block.children.length - 1}
              onUpdate={(updater) => update(block.id, child.id, updater)}
              onRemove={() => remove(block.id, child.id)}
              onMoveLeft={() => move(block.id, child.id, -1)}
              onMoveRight={() => move(block.id, child.id, 1)}
              onPopOut={() => popOut(block.id, child.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface InlineRowChildCardProps {
  child: FooterLeafBlock;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onUpdate: (updater: (b: FooterLeafBlock) => FooterLeafBlock) => void;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onPopOut: () => void;
}

function InlineRowChildCard({
  child,
  canMoveLeft,
  canMoveRight,
  onUpdate,
  onRemove,
  onMoveLeft,
  onMoveRight,
  onPopOut,
}: InlineRowChildCardProps) {
  function switchType(nextType: FooterLeafBlockType) {
    if (nextType === child.type) return;
    // Same reseed semantics as the top-level type switcher: preserve id +
    // align, drop other fields since they don't overlap across variants.
    onUpdate(() => makeFooterLeafBlock(nextType, { id: child.id, align: child.align }));
  }

  function setAlign(align: FooterBlockAlign) {
    onUpdate((b) => ({ ...b, align }));
  }

  return (
    <div className="space-y-2 rounded-md border bg-card p-2">
      <div className="flex items-center gap-1">
        <select
          aria-label="Inline row child type"
          value={child.type}
          onChange={(e) => switchType(e.target.value as FooterLeafBlockType)}
          className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
        >
          {LEAF_BLOCK_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={!canMoveLeft}
          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Move block left within row"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={!canMoveRight}
          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Move block right within row"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onPopOut}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label="Pop block out of inline row"
          title="Pop block out of the inline row (becomes a sibling of the row in the column)"
        >
          <Ungroup className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-muted-foreground hover:text-destructive"
          aria-label="Remove block from inline row"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <AlignToggle value={child.align} onChange={setAlign} />
      {child.type === "linkList" ? (
        <LinkListBlockBody
          block={child}
          columnIndex={0}
          onChange={(patch) => onUpdate((b) => ({ ...(b as FooterLinkListBlock), ...patch }))}
        />
      ) : child.type === "image" ? (
        <ImageBlockBody
          block={child}
          onChange={(patch) => onUpdate((b) => ({ ...(b as FooterImageBlock), ...patch }))}
        />
      ) : child.type === "imageLink" ? (
        <ImageLinkBlockBody
          block={child}
          onChange={(patch) =>
            onUpdate((b) => ({ ...(b as FooterImageLinkBlock), ...patch }))
          }
        />
      ) : child.type === "text" ? (
        <TextBlockBody
          block={child}
          onChange={(patch) => onUpdate((b) => ({ ...(b as FooterTextBlock), ...patch }))}
        />
      ) : child.type === "copyright" ? (
        <CopyrightBlockBody
          block={child}
          onChange={(patch) =>
            onUpdate((b) => ({ ...(b as FooterCopyrightBlock), ...patch }))
          }
        />
      ) : (
        <SocialBlockBody
          block={child}
          onChange={(patch) =>
            onUpdate((b) => ({ ...(b as FooterSocialBlock), ...patch }))
          }
        />
      )}
    </div>
  );
}

function ImageSizeFields({
  maxWidth,
  maxHeight,
  onChange,
}: {
  maxWidth: number;
  maxHeight: number;
  onChange: (patch: { maxWidth?: number; maxHeight?: number }) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <PxInput
        label="Max width"
        value={maxWidth}
        onChange={(v) => onChange({ maxWidth: v })}
      />
      <PxInput
        label="Max height"
        value={maxHeight}
        onChange={(v) => onChange({ maxHeight: v })}
      />
    </div>
  );
}

function PxInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="space-y-1 text-xs">
      <span className="text-muted-foreground">{label} (px)</span>
      <Input
        type="number"
        min={0}
        max={2000}
        value={value || ""}
        placeholder="Auto"
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
        }}
        className="h-8 text-xs"
      />
    </label>
  );
}

/** Shared image source picker: preview, URL input, and MediaPicker browse. */
function ImageSrcField({
  src,
  onChange,
  placeholderLabel,
}: {
  src: string;
  onChange: (next: string) => void;
  placeholderLabel: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-input bg-muted/30">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- editor-supplied URL; next/image would require remotePatterns per host.
            <img src={src} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="px-1 text-center text-[10px] leading-tight text-muted-foreground">
              {placeholderLabel}
            </span>
          )}
        </div>
        <div className="flex flex-1 gap-1">
          <Input
            aria-label="Image URL"
            value={src}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or Browse"
            className="h-8 text-xs"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPickerOpen(true)}
            className="shrink-0"
          >
            <ImagePlus className="mr-1 h-3.5 w-3.5" /> Browse
          </Button>
        </div>
      </div>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(urls) => urls[0] && onChange(urls[0])}
        accept="image"
      />
    </div>
  );
}
