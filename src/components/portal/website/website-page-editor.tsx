"use client";

import { PuckEditor } from "@/lib/puck/editor-wrapper";
import { savePageData, publishPage } from "@/actions/website";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Data } from "@puckeditor/core";
import { useState } from "react";

interface WebsitePageEditorProps {
  pageId: string;
  initialData: Data;
  status: string;
}

export function WebsitePageEditor({ pageId, initialData, status }: WebsitePageEditorProps) {
  const [saving, setSaving] = useState(false);

  async function handleSave(data: Data) {
    setSaving(true);
    await savePageData(pageId, data as Record<string, unknown>);
    setSaving(false);
  }

  async function handlePublish() {
    await publishPage(pageId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={status === "published" ? "success" : "secondary"}>{status}</Badge>
        {status === "draft" && (
          <Button size="sm" onClick={handlePublish}>Publish Page</Button>
        )}
        {saving && <span className="text-sm text-muted-foreground">Saving...</span>}
      </div>
      <div className="rounded-lg border overflow-hidden" style={{ minHeight: "70vh" }}>
        <PuckEditor initialData={initialData} onSave={handleSave} />
      </div>
    </div>
  );
}
