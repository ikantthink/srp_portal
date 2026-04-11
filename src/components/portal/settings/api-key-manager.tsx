"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface ApiKeyManagerProps {
  service: string;
  fields: string[];
  currentConfig: Record<string, unknown>;
}

export function ApiKeyManager({ service, fields, currentConfig }: ApiKeyManagerProps) {
  const [config, setConfig] = useState<Record<string, string>>(
    fields.reduce(
      (acc, f) => ({ ...acc, [f]: (currentConfig[f] as string) || "" }),
      {} as Record<string, string>
    )
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setLoading(true);
    setSuccess(false);

    const supabase = createClient();
    await supabase.from("api_configurations").upsert(
      { service, config },
      { onConflict: "service" }
    );

    setLoading(false);
    setSuccess(true);
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field} className="space-y-1">
          <Label className="text-xs capitalize">{field.replace("_", " ")}</Label>
          <Input
            type="password"
            value={config[field]}
            onChange={(e) => setConfig((prev) => ({ ...prev, [field]: e.target.value }))}
            placeholder={`Enter ${field.replace("_", " ")}`}
            className="font-mono text-sm"
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        {success && <span className="text-xs text-emerald-600">Saved!</span>}
      </div>
    </div>
  );
}
