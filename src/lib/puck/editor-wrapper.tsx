"use client";

import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig, buildConfigWithPresets, type BlockPresetData } from "./config";
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { generatePageData } from "./ai/generate-page";
import { SearchInput } from "@/components/ui/search-input";

interface PuckEditorProps {
  initialData?: Data;
  onChange?: (data: Data) => void;
  onSave: (data: Data) => void | Promise<void>;
  /** Called with the AI-generated doc after the user confirms the overwrite.
   * The parent typically persists the result and updates its own latest-data
   * cache. The wrapper handles forcing Puck to remount with the new data. */
  onAIGenerated?: (data: Data) => void | Promise<void>;
  formSlug?: string;
  aiEnabled?: boolean;
}

export function PuckEditor({
  initialData,
  onChange,
  onSave,
  onAIGenerated,
  formSlug,
  aiEnabled = false,
}: PuckEditorProps) {
  const [presets, setPresets] = useState<BlockPresetData[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/block-presets")
      .then((r) => r.json())
      .then((data) => setPresets(data))
      .catch(() => {});
  }, []);

  const config = useMemo(
    () =>
      presets.length > 0
        ? buildConfigWithPresets(presets, { formSlug })
        : formSlug
          ? buildConfigWithPresets([], { formSlug })
          : puckConfig,
    [presets, formSlug]
  );

  const filteredConfig = useMemo(() => {
    if (!search.trim()) return config;

    const term = search.toLowerCase();
    const matchingComponents = Object.entries(config.components).filter(
      ([key, comp]) => {
        const label = (comp as any).label || key;
        return (
          key.toLowerCase().includes(term) ||
          label.toLowerCase().includes(term)
        );
      }
    );

    const matchingKeys = new Set(matchingComponents.map(([k]) => k));

    const filteredCategories: Record<string, any> = {};
    if (config.categories) {
      for (const [catKey, cat] of Object.entries(config.categories as Record<string, any>)) {
        const filtered = (cat.components || []).filter((c: string) => matchingKeys.has(c));
        if (filtered.length > 0) {
          filteredCategories[catKey] = { ...cat, components: filtered, defaultExpanded: true };
        }
      }
    }

    return {
      ...config,
      categories: filteredCategories,
    } as typeof config;
  }, [config, search]);

  // Strip blocks whose type is no longer registered (e.g. legacy MainNav /
  // Footer blocks that are now global site chrome). Puck's editor doesn't
  // gracefully handle unknown component types, so we filter them out before
  // handing the doc to Puck.
  const sanitiseData = (raw: Data | undefined): Data => {
    const safe = raw || { content: [], root: { props: {} } };
    const content = (safe.content || []).filter((item) => {
      const type = (item as { type: string }).type;
      return !!config.components[type];
    });
    return { ...safe, content } as Data;
  };

  // Puck takes `data` as initial-only; to swap the data wholesale (e.g. after
  // an AI generation overwrites the draft) we bump `puckKey` to force a
  // remount with the new seed.
  const [puckKey, setPuckKey] = useState(0);
  const [puckData, setPuckData] = useState<Data>(() => sanitiseData(initialData));

  // If the upstream `initialData` reference changes (e.g. parent reloaded the
  // page), reseed our internal state.
  useEffect(() => {
    setPuckData(sanitiseData(initialData));
    setPuckKey((k) => k + 1);
    // We intentionally depend on the raw ref so callers can pass a fresh
    // object to force a refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  async function handleAIGenerated(next: Data) {
    if (!window.confirm("This will replace your current draft. Continue?")) return;
    const safe = sanitiseData(next);
    setPuckData(safe);
    setPuckKey((k) => k + 1);
    if (onAIGenerated) await onAIGenerated(safe);
  }

  return (
    <div className="relative">
      <Puck
        key={puckKey}
        config={filteredConfig}
        data={puckData}
        onChange={onChange}
        onPublish={onSave}
        overrides={{
          // Hide Puck's built-in Publish button — saving is owned by the parent
          // toolbar so users don't confuse "Publish" (persist puck_data) with
          // "Publish to Live" (status toggle). We still keep onPublish wired so
          // any latent keyboard shortcut continues to call onSave.
          headerActions: () =>
            aiEnabled ? <AIGenerateButton onGenerated={handleAIGenerated} /> : <></>,
          drawer: ({ children }) => (
            <div>
              <div className="px-2 pb-2">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search components..."
                  className="w-full [&_input]:h-8"
                />
              </div>
              {children}
            </div>
          ),
        }}
      />
    </div>
  );
}

function AIGenerateButton({ onGenerated }: { onGenerated: (data: Data) => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    function updatePos() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generatePageData(prompt);
      if (result.data) {
        await onGenerated(result.data as Data);
        setOpen(false);
        setPrompt("");
      } else {
        setError(result.error || "Generation failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="mr-2 rounded-lg bg-brand-secondary px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-secondary/90"
      >
        AI Generate
      </button>
      {open && mounted && pos &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 1000 }}
            className="w-80 rounded-lg border border-border bg-card p-4 shadow-lg"
          >
            <p className="text-sm font-medium mb-2 text-foreground">Describe the page you want</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A seller landing page with hero, testimonials, and contact form"
              className="w-full h-20 rounded-lg border border-border bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {error && (
              <p className="mt-2 text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
