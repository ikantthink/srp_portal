"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

type GoogleSource = "places" | "business_profile";

interface GoogleReviewsSettingsProps {
  currentConfig: Record<string, unknown>;
}

const PLACES_FIELDS = [
  { key: "api_key", label: "API key", secret: true },
  { key: "place_id", label: "Place ID", secret: false },
] as const;

const BUSINESS_FIELDS = [
  { key: "client_id", label: "OAuth client ID", secret: false },
  { key: "client_secret", label: "OAuth client secret", secret: true },
  { key: "refresh_token", label: "Refresh token", secret: true },
  { key: "account_id", label: "Account ID", secret: false },
  { key: "location_id", label: "Location ID", secret: false },
] as const;

export function GoogleReviewsSettings({ currentConfig }: GoogleReviewsSettingsProps) {
  const initialSource =
    currentConfig.source === "business_profile" ? "business_profile" : "places";
  const [source, setSource] = useState<GoogleSource>(initialSource);
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const fields = source === "places" ? PLACES_FIELDS : BUSINESS_FIELDS;
    return fields.reduce(
      (acc, f) => ({ ...acc, [f.key]: (currentConfig[f.key] as string) || "" }),
      { source: initialSource } as Record<string, string>
    );
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchSource(next: GoogleSource) {
    setSource(next);
    const fields = next === "places" ? PLACES_FIELDS : BUSINESS_FIELDS;
    setConfig(
      fields.reduce(
        (acc, f) => ({
          ...acc,
          [f.key]: (currentConfig[f.key] as string) || config[f.key] || "",
        }),
        { source: next } as Record<string, string>
      )
    );
  }

  async function handleSave() {
    setLoading(true);
    setSuccess(false);
    setError(null);
    const fields = source === "places" ? PLACES_FIELDS : BUSINESS_FIELDS;
    const payload = fields.reduce(
      (acc, f) => ({ ...acc, [f.key]: config[f.key] ?? "" }),
      { source } as Record<string, string>
    );

    const supabase = createClient();
    const { error: saveError } = await supabase.from("api_configurations").upsert(
      { service: "google_reviews", config: payload },
      { onConflict: "service" }
    );

    setLoading(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setSuccess(true);
  }

  const fields = source === "places" ? PLACES_FIELDS : BUSINESS_FIELDS;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs">Data source</Label>
        <select
          value={source}
          onChange={(e) => switchSource(e.target.value as GoogleSource)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="places">Google Places API (up to 5 reviews)</option>
          <option value="business_profile">Google Business Profile API (full access)</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {source === "places"
            ? "Simpler setup: API key + Place ID from Google Cloud Console."
            : "Requires OAuth credentials and a refresh token for your verified business."}
        </p>
      </div>

      {fields.map((field) => (
        <div key={field.key} className="space-y-1">
          <Label className="text-xs">{field.label}</Label>
          <Input
            type={field.secret ? "password" : "text"}
            value={config[field.key] ?? ""}
            onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className={field.secret ? "font-mono text-sm" : "text-sm"}
          />
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        {success && <span className="text-xs text-emerald-600">Saved!</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
