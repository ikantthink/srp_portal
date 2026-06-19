"use client";

import { useRef, useState, useCallback, type DragEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { finalizeUpload } from "@/actions/media";
import { MEDIA_BUCKET } from "@/lib/media/constants";
import { safeFilename, getImageDimensions } from "./media-utils";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaFile } from "@/types/database";

const ACCEPTED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
  "video/webm",
];
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

interface UploadDropzoneProps {
  folderId: string;
  folderSlug: string;
  onUploaded: (files: MediaFile[]) => void;
  compact?: boolean;
}

interface ProgressItem {
  name: string;
  status: "uploading" | "done" | "error";
  message?: string;
}

export function UploadDropzone({
  folderId,
  folderSlug,
  onUploaded,
  compact,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<ProgressItem[]>([]);

  const uploadOne = useCallback(
    async (file: File): Promise<MediaFile | null> => {
      if (!ACCEPTED_MIME.includes(file.type)) {
        return Promise.reject(new Error(`Unsupported type: ${file.type || "unknown"}`));
      }
      if (file.size > MAX_SIZE) {
        return Promise.reject(new Error("File exceeds 100 MB limit"));
      }

      const supabase = createClient();
      const ext = file.name.split(".").pop() || "bin";
      const baseName = safeFilename(file.name.replace(/\.[^.]+$/, "")) || "file";
      const storagePath = `${folderSlug}/${Date.now()}-${baseName}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return Promise.reject(new Error(uploadError.message));
      }

      const dims = await getImageDimensions(file);

      const result = await finalizeUpload({
        folderId,
        storagePath,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
      });

      if ("error" in result) {
        // Best-effort cleanup — the storage object exists but we couldn't
        // record it, so the user wouldn't see it in the library anyway.
        await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
        return Promise.reject(new Error(result.error));
      }

      return result.data ?? null;
    },
    [folderId, folderSlug]
  );

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      setProgress(
        files.map((f) => ({ name: f.name, status: "uploading" as const }))
      );

      const uploaded: MediaFile[] = [];
      let errorCount = 0;

      // Sequential uploads keep the UI deterministic and avoid hammering the
      // storage API. For bulk uploads of many small files this still feels
      // responsive because each finalize returns within a few hundred ms.
      for (let i = 0; i < files.length; i++) {
        try {
          const result = await uploadOne(files[i]);
          if (result) uploaded.push(result);
          setProgress((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, status: "done" } : p))
          );
        } catch (err) {
          errorCount++;
          setProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? {
                    ...p,
                    status: "error",
                    message: err instanceof Error ? err.message : "Upload failed",
                  }
                : p
            )
          );
        }
      }

      if (uploaded.length > 0) onUploaded(uploaded);

      // Auto-clear the strip on full success; leave it visible on errors so
      // users can read the message.
      if (errorCount === 0) {
        setTimeout(() => setProgress([]), 1500);
      }
    },
    [uploadOne, onUploaded]
  );

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors",
          compact ? "gap-1 px-4 py-4" : "gap-2 px-4 py-8",
          dragOver
            ? "border-brand-primary bg-brand-primary/5"
            : "border-border hover:bg-muted/40"
        )}
      >
        <Upload
          className={cn("text-muted-foreground", compact ? "h-5 w-5" : "h-7 w-7")}
        />
        <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
          {compact ? "Drop or click to upload" : "Drop files here or click to upload"}
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WebP, GIF, SVG, PDF, MP4, WebM — up to 100 MB each
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_MIME.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {progress.length > 0 && (
        <ul className="space-y-1 text-xs">
          {progress.map((p, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded border px-2 py-1.5"
            >
              {p.status === "uploading" && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              {p.status === "done" && (
                <span className="text-brand-primary">✓</span>
              )}
              {p.status === "error" && (
                <span className="text-destructive">✕</span>
              )}
              <span className="truncate flex-1">{p.name}</span>
              {p.message && (
                <span className="text-destructive truncate">{p.message}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
