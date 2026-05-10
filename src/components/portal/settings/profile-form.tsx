"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Camera, Loader2 } from "lucide-react";

function AvatarUpload({
  userId,
  currentUrl,
  onUploaded,
}: {
  userId: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    setPreview(publicUrl);
    onUploaded(publicUrl);
    setUploading(false);

    if (inputRef.current) inputRef.current.value = "";
  }

  const initials = "?";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative h-24 w-24 rounded-full overflow-hidden border-2 border-white/20 transition-colors hover:border-white/50"
        disabled={uploading}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/10 text-2xl font-bold text-white/60">
            {initials}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        disabled={uploading}
      />
      <p className="text-xs text-muted-foreground">
        {uploading ? "Uploading..." : "Click to change avatar"}
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name") as string,
        phone: (formData.get("phone") as string) || null,
        bio: (formData.get("bio") as string) || null,
        slug: (formData.get("slug") as string) || profile.slug,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);

    setLoading(false);
    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AvatarUpload
        userId={profile.user_id}
        currentUrl={profile.avatar_url}
        onUploaded={(url) => setAvatarUrl(url)}
      />

      <div className="space-y-2">
        <Label htmlFor="pf-name">Full Name</Label>
        <Input
          id="pf-name"
          name="full_name"
          defaultValue={profile.full_name}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-email">Email</Label>
        <Input
          id="pf-email"
          value={profile.email}
          disabled
          className="opacity-70"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-phone">Phone</Label>
        <PhoneInput
          id="pf-phone"
          name="phone"
          defaultValue={profile.phone ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-slug">Link Card Slug</Label>
        <Input id="pf-slug" name="slug" defaultValue={profile.slug} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-bio">Bio</Label>
        <Textarea id="pf-bio" name="bio" defaultValue={profile.bio ?? ""} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        {success && <span className="text-sm text-emerald-600">Saved!</span>}
      </div>
    </form>
  );
}
