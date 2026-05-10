"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FormVersion } from "@/types/database";
import { Globe, Pencil, Upload, Loader2 } from "lucide-react";

interface VersionHistoryProps {
  versions: FormVersion[];
  currentVersionId: string | null;
  publishedVersionId: string | null;
  onPublishVersion: (versionId: string) => void;
  onLoadVersion: (versionId: string) => void;
  isLoading: boolean;
}

export function VersionHistory({
  versions,
  currentVersionId,
  publishedVersionId,
  onPublishVersion,
  onLoadVersion,
  isLoading,
}: VersionHistoryProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Each save creates a new version. The public form only shows the published version.
      </p>
      <div className="rounded-lg border divide-y">
        {versions.map((v) => {
          const isCurrent = v.id === currentVersionId;
          const isPublished = v.id === publishedVersionId;
          const date = new Date(v.created_at);

          return (
            <div
              key={v.id}
              className={`flex items-center justify-between px-4 py-3 ${
                isCurrent ? "bg-muted/40" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium">v{v.version_number}</span>
                <span className="text-sm text-muted-foreground">
                  {date.toLocaleDateString()}{" "}
                  {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex items-center gap-1.5">
                  {isPublished && (
                    <Badge variant="success" className="gap-1">
                      <Globe className="h-3 w-3" /> Live
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="outline" className="gap-1">
                      <Pencil className="h-3 w-3" /> Editing
                    </Badge>
                  )}
                  {v.status === "published" && !isPublished && (
                    <Badge variant="secondary">Previously Published</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadVersion(v.id)}
                    disabled={isLoading}
                  >
                    Load into Editor
                  </Button>
                )}
                {!isPublished && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onPublishVersion(v.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="mr-1 h-3 w-3" />
                    )}
                    Publish
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {versions.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No versions saved yet.
          </div>
        )}
      </div>
    </div>
  );
}
