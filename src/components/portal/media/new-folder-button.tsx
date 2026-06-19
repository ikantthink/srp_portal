"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFolder } from "@/actions/media";
import { FolderPlus, Loader2, X } from "lucide-react";
import type { MediaFolder } from "@/types/database";

interface NewFolderButtonProps {
  onCreated: (folder: MediaFolder) => void;
}

export function NewFolderButton({ onCreated }: NewFolderButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const result = await createFolder(name);
    setSaving(false);
    if ("error" in result) {
      setError(result.error ?? "Failed to create folder");
      return;
    }
    if (result.data) {
      onCreated(result.data);
    }
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FolderPlus className="h-4 w-4" />
        New folder
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setOpen(false);
            setName("");
            setError(null);
          }
        }}
        placeholder="Folder name"
        className="h-9 w-44"
        disabled={saving}
      />
      <Button size="sm" onClick={submit} disabled={saving || !name.trim()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          setOpen(false);
          setName("");
          setError(null);
        }}
        className="h-9 w-9"
      >
        <X className="h-4 w-4" />
      </Button>
      {error && (
        <span className="text-xs text-destructive ml-2">{error}</span>
      )}
    </div>
  );
}
