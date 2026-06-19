import type { MediaFile } from "@/types/database";

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/");
}

export function isPdfMime(mime: string): boolean {
  return mime === "application/pdf";
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function fileDisplayName(file: MediaFile): string {
  return file.display_name?.trim() || file.filename;
}

const SAFE_FILENAME = /[^a-zA-Z0-9._-]+/g;

export function safeFilename(name: string): string {
  return name.replace(SAFE_FILENAME, "-").replace(/-+/g, "-");
}

/** Probe an image File for natural width/height. Resolves null on non-images. */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return Promise.resolve(null);
  if (file.type === "image/svg+xml") return Promise.resolve(null);

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
