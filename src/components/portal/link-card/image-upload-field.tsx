"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, X } from "lucide-react";

const BUCKET = "link-card-assets";
const ACCEPTED = "image/png,image/jpeg,image/webp,image/gif";
const MAX_SIZE = 10 * 1024 * 1024;

interface ImageUploadFieldProps {
  label: string;
  id: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
  className?: string;
}

export function ImageUploadField({
  label,
  id,
  currentUrl,
  onUploaded,
  onRemoved,
  className,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setError("File must be under 10 MB");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setError("Not authenticated");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    setPreview(publicUrl);
    onUploaded(publicUrl);
    setUploading(false);

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    setPreview(null);
    onRemoved();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      {preview ? (
        <div className="mt-1 flex items-center gap-3">
          <div className="relative h-16 w-28 rounded border bg-muted p-0.5 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              className="h-full w-full object-cover rounded"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
          >
            <X className="mr-1 h-3 w-3" /> Remove
          </Button>
        </div>
      ) : (
        <div className="mt-1">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Choose image"}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
