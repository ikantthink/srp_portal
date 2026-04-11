"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { rollbackLinkCardVersion } from "@/actions/link-cards";
import type { LinkCardVersion } from "@/types/database";
import { RotateCcw } from "lucide-react";

export function LinkCardVersionHistory({
  linkCardId,
  currentVersionId,
  versions,
}: {
  linkCardId: string;
  currentVersionId: string | null;
  versions: LinkCardVersion[];
}) {
  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <div
          key={version.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div>
            <p className="font-medium">
              Version {version.version_number}
              {version.id === currentVersionId && (
                <Badge variant="success" className="ml-2">Current</Badge>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(version.created_at).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {(version.widgets as unknown[])?.length || 0} widgets
            </p>
          </div>
          {version.id !== currentVersionId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => rollbackLinkCardVersion(linkCardId, version.id)}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Rollback
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
