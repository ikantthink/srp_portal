"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-auth";
import { MEDIA_BUCKET } from "@/lib/media/constants";
import type { MediaFile, MediaFolder, MediaTag } from "@/types/database";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function getPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`;
}

function withPublicUrls(files: MediaFile[]): MediaFile[] {
  return files.map((f) => ({ ...f, public_url: getPublicUrl(f.storage_path) }));
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export async function listFolders(): Promise<MediaFolder[]> {
  const supabase = await createClient();

  const { data: folders } = await supabase
    .from("media_folders")
    .select("*")
    .order("is_system", { ascending: false })
    .order("name");

  if (!folders) return [];

  // Hydrate counts in one round-trip
  const { data: countRows } = await supabase
    .from("media_files")
    .select("folder_id");

  const counts = new Map<string, number>();
  for (const row of (countRows as { folder_id: string }[]) || []) {
    counts.set(row.folder_id, (counts.get(row.folder_id) ?? 0) + 1);
  }

  return (folders as MediaFolder[]).map((f) => ({
    ...f,
    file_count: counts.get(f.id) ?? 0,
  }));
}

export async function createFolder(name: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Folder name is required" };

  const supabase = await createClient();
  const slug = slugify(trimmed);
  if (!slug) return { error: "Folder name must contain letters or numbers" };

  const { data, error } = await supabase
    .from("media_folders")
    .insert({ name: trimmed, slug, is_system: false })
    .select()
    .single();

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return { error: "A folder with this name already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/portal/media");
  return { data: data as MediaFolder };
}

export async function renameFolder(id: string, name: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Folder name is required" };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("media_folders")
    .select("is_system")
    .eq("id", id)
    .single();

  if (!existing) return { error: "Folder not found" };
  if (existing.is_system) return { error: "System folders cannot be renamed" };

  const { error } = await supabase
    .from("media_folders")
    .update({ name: trimmed, slug: slugify(trimmed) })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/portal/media");
  return { success: true };
}

export async function deleteFolder(id: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("media_folders")
    .select("is_system")
    .eq("id", id)
    .single();

  if (!existing) return { error: "Folder not found" };
  if (existing.is_system) return { error: "System folders cannot be deleted" };

  const { count } = await supabase
    .from("media_files")
    .select("*", { count: "exact", head: true })
    .eq("folder_id", id);

  if ((count ?? 0) > 0) {
    return { error: "Folder is not empty. Move or delete its files first." };
  }

  const { error } = await supabase.from("media_folders").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/portal/media");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export interface ListFilesOptions {
  folderId?: string | null;
  search?: string;
  tagIds?: string[];
}

export async function listFiles(
  options: ListFilesOptions = {}
): Promise<MediaFile[]> {
  const supabase = await createClient();

  let query = supabase
    .from("media_files")
    .select("*")
    .order("created_at", { ascending: false });

  if (options.folderId) {
    query = query.eq("folder_id", options.folderId);
  }

  if (options.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`filename.ilike.${term},display_name.ilike.${term}`);
  }

  // Tag filter is applied post-fetch because PostgREST can't easily express
  // "file has all of these tags" through the join table without a view.
  const { data, error } = await query;
  if (error || !data) return [];

  let files = data as MediaFile[];

  // Hydrate tags in one query
  const ids = files.map((f) => f.id);
  if (ids.length === 0) return [];

  const { data: tagRows } = await supabase
    .from("media_file_tags")
    .select("file_id, media_tags(*)")
    .in("file_id", ids);

  type TagRow = { file_id: string; media_tags: MediaTag | MediaTag[] };
  const tagsByFile = new Map<string, MediaTag[]>();
  for (const row of (tagRows as TagRow[]) || []) {
    const tag = Array.isArray(row.media_tags) ? row.media_tags[0] : row.media_tags;
    if (!tag) continue;
    if (!tagsByFile.has(row.file_id)) tagsByFile.set(row.file_id, []);
    tagsByFile.get(row.file_id)!.push(tag);
  }

  files = files.map((f) => ({
    ...f,
    tags: tagsByFile.get(f.id) ?? [],
  }));

  if (options.tagIds && options.tagIds.length > 0) {
    const required = new Set(options.tagIds);
    files = files.filter((f) =>
      Array.from(required).every((t) => f.tags!.some((ft) => ft.id === t))
    );
  }

  return withPublicUrls(files);
}

export interface FinalizeUploadInput {
  folderId: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
}

export async function finalizeUpload(input: FinalizeUploadInput) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { error: storageErr } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(input.storagePath, 60);

  if (storageErr) {
    return { error: "Uploaded file not found in storage" };
  }

  const { data, error } = await supabase
    .from("media_files")
    .insert({
      folder_id: input.folderId,
      storage_path: input.storagePath,
      filename: input.filename,
      display_name: input.filename,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      width: input.width ?? null,
      height: input.height ?? null,
      uploaded_by: auth.userId,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal/media");
  return {
    data: { ...(data as MediaFile), public_url: getPublicUrl(input.storagePath) },
  };
}

/**
 * Sanitise a user-provided display name into something safe to live inside a
 * storage object key. We allow letters/numbers/dot/underscore/dash and
 * collapse everything else into a single dash.
 */
function safeStorageBase(input: string): string {
  const cleaned = input
    .replace(/\.[^.]+$/, "") // drop any extension the user typed
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return cleaned || "file";
}

export async function renameFile(id: string, displayName: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const trimmed = displayName.trim();
  if (!trimmed) return { error: "Name is required" };

  const { data: existing } = await supabase
    .from("media_files")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (!existing) return { error: "File not found" };

  const oldPath = (existing as { storage_path: string }).storage_path;
  const lastSlash = oldPath.lastIndexOf("/");
  const dir = lastSlash >= 0 ? oldPath.slice(0, lastSlash) : "";
  const oldFilename = lastSlash >= 0 ? oldPath.slice(lastSlash + 1) : oldPath;
  const extMatch = oldFilename.match(/\.([^.]+)$/);
  const ext = extMatch ? extMatch[1] : "bin";

  // Timestamp prefix matches the upload convention and guarantees uniqueness
  // even when two files in the same folder share a display name.
  const base = safeStorageBase(trimmed);
  const newPath = `${dir ? dir + "/" : ""}${Date.now()}-${base}.${ext}`;

  if (newPath !== oldPath) {
    const { error: moveErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .move(oldPath, newPath);

    if (moveErr) {
      return { error: `Storage rename failed: ${moveErr.message}` };
    }
  }

  const { error: dbErr } = await supabase
    .from("media_files")
    .update({ display_name: trimmed, storage_path: newPath })
    .eq("id", id);

  if (dbErr) {
    // The DB update failed after we already moved the object. Best-effort
    // roll the storage object back so the public URL still works.
    if (newPath !== oldPath) {
      await supabase.storage.from(MEDIA_BUCKET).move(newPath, oldPath);
    }
    return { error: dbErr.message };
  }

  revalidatePath("/portal/media");
  return { success: true, public_url: getPublicUrl(newPath) };
}

// ---------------------------------------------------------------------------
// Bulk actions
// ---------------------------------------------------------------------------

export async function deleteFiles(ids: string[]) {
  if (ids.length === 0) return { success: true };
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: files } = await supabase
    .from("media_files")
    .select("id, storage_path")
    .in("id", ids);

  if (!files || files.length === 0) return { success: true };

  const paths = (files as { id: string; storage_path: string }[]).map(
    (f) => f.storage_path
  );

  // Remove from storage first so we don't end up with DB rows pointing at
  // objects that may have been deleted manually.
  const { error: storageError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove(paths);
  if (storageError) {
    return { error: `Storage delete failed: ${storageError.message}` };
  }

  const { error } = await supabase
    .from("media_files")
    .delete()
    .in("id", ids);

  if (error) return { error: error.message };

  revalidatePath("/portal/media");
  return { success: true };
}

export async function moveFiles(ids: string[], folderId: string) {
  if (ids.length === 0) return { success: true };
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("media_files")
    .update({ folder_id: folderId })
    .in("id", ids);

  if (error) return { error: error.message };
  revalidatePath("/portal/media");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function listTags(): Promise<MediaTag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("media_tags")
    .select("*")
    .order("name");
  return (data as MediaTag[]) || [];
}

/**
 * Find an existing tag by case-insensitive name, or create it. Returns the
 * tag row so callers (like the file-row inline tag input) can immediately
 * link it to a file without a second round-trip.
 */
export async function findOrCreateTag(name: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Tag name is required" };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("media_tags")
    .select("*")
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) return { data: existing as MediaTag };

  // Cycle through a small palette so freshly created tags don't all look the
  // same. The colour is just visual; users can change it later if we ever
  // add an edit UI.
  const palette = [
    "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
    "#8b5cf6", "#06b6d4", "#ec4899", "#10b981",
  ];
  const color = palette[Math.floor(Math.random() * palette.length)];

  const { data, error } = await supabase
    .from("media_tags")
    .insert({ name: trimmed, color })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/portal/media");
  return { data: data as MediaTag };
}

export async function deleteTag(id: string) {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase.from("media_tags").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/media");
  return { success: true };
}

export async function applyTagToFiles(tagId: string, fileIds: string[]) {
  if (fileIds.length === 0) return { success: true };
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const rows = fileIds.map((file_id) => ({ file_id, tag_id: tagId }));
  // upsert with ignoreDuplicates so re-applying a tag is idempotent and
  // doesn't blow up on the (file_id, tag_id) primary key.
  const { error } = await supabase
    .from("media_file_tags")
    .upsert(rows, { ignoreDuplicates: true, onConflict: "file_id,tag_id" });

  if (error) return { error: error.message };
  revalidatePath("/portal/media");
  return { success: true };
}

export async function removeTagFromFiles(tagId: string, fileIds: string[]) {
  if (fileIds.length === 0) return { success: true };
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("media_file_tags")
    .delete()
    .eq("tag_id", tagId)
    .in("file_id", fileIds);

  if (error) return { error: error.message };
  revalidatePath("/portal/media");
  return { success: true };
}

export async function clearTagsFromFiles(fileIds: string[]) {
  if (fileIds.length === 0) return { success: true };
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("media_file_tags")
    .delete()
    .in("file_id", fileIds);

  if (error) return { error: error.message };
  revalidatePath("/portal/media");
  return { success: true };
}
