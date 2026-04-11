"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { BrandSettings } from "@/types/database";
import { Loader2 } from "lucide-react";

export function BrandingForm({ settings }: { settings: BrandSettings | null }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    primary_color: settings?.primary_color || "#1e40af",
    secondary_color: settings?.secondary_color || "#7c3aed",
    accent_color: settings?.accent_color || "#f59e0b",
    font_heading: settings?.font_heading || "Geist",
    font_body: settings?.font_body || "Geist",
    logo_url: settings?.logo_url || "",
    logo_dark_url: settings?.logo_dark_url || "",
    favicon_url: settings?.favicon_url || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const supabase = createClient();

    if (settings?.id) {
      await supabase.from("brand_settings").update(form).eq("id", settings.id);
    } else {
      await supabase.from("brand_settings").insert(form);
    }

    document.documentElement.style.setProperty("--brand-primary", form.primary_color);
    document.documentElement.style.setProperty("--brand-secondary", form.secondary_color);
    document.documentElement.style.setProperty("--brand-accent", form.accent_color);

    setLoading(false);
    setSuccess(true);
  }

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Logos</h3>
        <div className="space-y-2">
          <Label htmlFor="b-logo">Logo URL</Label>
          <Input
            id="b-logo"
            value={form.logo_url}
            onChange={(e) => updateField("logo_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-logo-dark">Dark Mode Logo URL</Label>
          <Input
            id="b-logo-dark"
            value={form.logo_dark_url}
            onChange={(e) => updateField("logo_dark_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-favicon">Favicon URL</Label>
          <Input
            id="b-favicon"
            value={form.favicon_url}
            onChange={(e) => updateField("favicon_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
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
          <div className="flex-1 rounded-lg p-4 text-center text-white text-sm font-medium" style={{ backgroundColor: form.primary_color }}>
            Primary
          </div>
          <div className="flex-1 rounded-lg p-4 text-center text-white text-sm font-medium" style={{ backgroundColor: form.secondary_color }}>
            Secondary
          </div>
          <div className="flex-1 rounded-lg p-4 text-center text-black text-sm font-medium" style={{ backgroundColor: form.accent_color }}>
            Accent
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Fonts</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="b-font-heading">Heading Font</Label>
            <Input
              id="b-font-heading"
              value={form.font_heading}
              onChange={(e) => updateField("font_heading", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-font-body">Body Font</Label>
            <Input
              id="b-font-body"
              value={form.font_body}
              onChange={(e) => updateField("font_body", e.target.value)}
            />
          </div>
        </div>
      </div>

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
