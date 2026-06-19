"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { setIntegrationEnabled } from "@/actions/integrations";
import type { IntegrationDef } from "@/lib/integrations/registry";
import type { IntegrationStatus } from "@/lib/integrations/status";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";

interface IntegrationToggleRowProps {
  def: IntegrationDef;
  status: IntegrationStatus;
}

export function IntegrationToggleRow({ def, status }: IntegrationToggleRowProps) {
  const [enabled, setEnabled] = useState(status.enabled);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasEnvVars = def.envVars.length > 0;
  const canToggleOn = !hasEnvVars || status.envOk;
  const switchDisabled = pending || (!enabled && !canToggleOn);

  function handleToggle(next: boolean) {
    setError(null);
    setEnabled(next);
    startTransition(async () => {
      const result = await setIntegrationEnabled(def.key, next);
      if (result.error) {
        setEnabled(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{def.label}</h3>
          {hasEnvVars ? (
            status.envOk ? (
              <Badge variant="success" className="gap-1">
                <Check className="h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Missing env
              </Badge>
            )
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{def.description}</p>
        {hasEnvVars && (
          <p className="text-xs text-muted-foreground">
            Env vars:{" "}
            {def.envVars.map((v, i) => (
              <span key={v}>
                <code
                  className={
                    status.missingEnvVars.includes(v)
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }
                >
                  {v}
                </code>
                {i < def.envVars.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {def.configHref && (
          <Link
            href={def.configHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
          >
            Configure
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={switchDisabled}
        />
        {!canToggleOn && !enabled && (
          <span className="text-[10px] text-muted-foreground">
            Set env vars first
          </span>
        )}
      </div>
    </div>
  );
}
