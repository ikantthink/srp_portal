"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSiteSettings } from "@/actions/site-settings";
import type { SiteSettings } from "@/types/database";
import { Loader2 } from "lucide-react";

export function DomainSettingsForm({
  settings,
  currentHost,
}: {
  settings: SiteSettings | null;
  currentHost: string | null;
}) {
  const [short, setShort] = useState(settings?.short_domain ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateSiteSettings({
      short_domain: short.trim() || null,
    });

    setLoading(false);
    if ("error" in result && result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Domain settings saved." });
    }
  }

  const previewCode = "Ax3kP7q";
  const previewHost = (short.trim() || currentHost || "your-domain.com")
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="short_domain">Short URL domain</Label>
        <Input
          id="short_domain"
          name="short_domain"
          value={short}
          onChange={(e) => setShort(e.target.value)}
          placeholder="exm.pl"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Display only. The portal renders share URLs using this host so they
          look like{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            {previewHost}/c/{previewCode}
          </code>
          . Add the domain to this Vercel project first; DNS + TLS are handled
          there. Leave blank to use the current host.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
        <p>
          <span className="font-semibold text-foreground">How it works:</span>{" "}
          every domain pointed at this Vercel project serves the same app.
          Visiting{" "}
          <code className="rounded bg-background px-1 py-0.5">/c/&lt;code&gt;</code>{" "}
          on any of them resolves a short URL, or falls back to a link card
          slug.
        </p>
        {currentHost && (
          <p>
            <span className="font-semibold text-foreground">Current host:</span>{" "}
            <code className="rounded bg-background px-1 py-0.5">
              {currentHost}
            </code>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Domain Settings
        </Button>
        {message && (
          <span
            className={
              message.type === "success"
                ? "text-sm text-emerald-600"
                : "text-sm text-red-500"
            }
          >
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
