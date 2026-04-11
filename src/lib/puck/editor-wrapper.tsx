"use client";

import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "./config";
import { useState } from "react";
import { generatePageData } from "./ai/generate-page";

interface PuckEditorProps {
  initialData?: Data;
  onSave: (data: Data) => void | Promise<void>;
}

export function PuckEditor({ initialData, onSave }: PuckEditorProps) {
  return (
    <div className="relative">
      <Puck
        config={puckConfig}
        data={initialData || { content: [], root: { props: {} } }}
        onPublish={onSave}
        overrides={{
          headerActions: () => <AIGenerateButton />,
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
      // The generated data needs to be applied to the editor.
      // For now we'll copy to clipboard as a JSON payload.
      // In a full integration, this would use Puck's dispatch API.
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
