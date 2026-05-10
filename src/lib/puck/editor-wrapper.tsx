"use client";

import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig, buildConfigWithPresets, type BlockPresetData } from "./config";
import { useState, useEffect, useMemo } from "react";
import { generatePageData } from "./ai/generate-page";
import { SearchInput } from "@/components/ui/search-input";

interface PuckEditorProps {
  initialData?: Data;
  onChange?: (data: Data) => void;
  onSave: (data: Data) => void | Promise<void>;
  formSlug?: string;
}

export function PuckEditor({ initialData, onChange, onSave, formSlug }: PuckEditorProps) {
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

  return (
    <div className="relative">
      <Puck
        config={filteredConfig}
        data={initialData || { content: [], root: { props: {} } }}
        onChange={onChange}
        onPublish={onSave}
        overrides={{
          headerActions: () => <AIGenerateButton />,
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

function AIGenerateButton() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    const result = await generatePageData(prompt);
    if (result.data) {
      navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      alert("Page data generated and copied to clipboard. Paste into the data field or reload with this data.");
    } else {
      alert(result.error || "Generation failed");
    }
    setLoading(false);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="mr-2 rounded-lg bg-brand-secondary px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-secondary/90"
      >
        AI Generate
      </button>
      {open && (
        <div className="absolute right-4 top-14 z-50 w-80 rounded-lg border bg-card p-4 shadow-lg">
          <p className="text-sm font-medium mb-2">Describe the page you want</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A seller landing page with hero, testimonials, and contact form"
            className="w-full h-20 rounded-lg border border-border bg-background p-2 text-sm"
          />
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
        </div>
      )}
    </>
  );
}
