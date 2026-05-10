"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadVersionIntoDraft } from "@/actions/forms";
import type { FormVersion } from "@/types/database";
import { RotateCcw } from "lucide-react";

interface FormVersionHistoryProps {
  formId: string;
  currentVersionId: string | null;
  versions: FormVersion[];
}

export function FormVersionHistory({
  formId,
  currentVersionId,
  versions,
}: FormVersionHistoryProps) {
  async function handleLoadVersion(versionId: string) {
    await loadVersionIntoDraft(formId, versionId);
  }

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
              {version.published_at && " (published)"}
            </p>
            <p className="text-xs text-muted-foreground">
              {((version.schema as any)?.fields?.length || 0)} fields
              {version.page_data ? " + landing page" : ""}
              {version.success_page_data ? " + success page" : ""}
            </p>
          </div>
          {version.id !== currentVersionId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoadVersion(version.id)}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Load into Editor
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
