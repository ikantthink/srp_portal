"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Loader2 } from "lucide-react";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      })
      .eq("id", profile.id);

    setLoading(false);
    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pf-name">Full Name</Label>
        <Input id="pf-name" name="full_name" defaultValue={profile.full_name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-email">Email</Label>
        <Input id="pf-email" value={profile.email} disabled className="opacity-70" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-phone">Phone</Label>
        <Input id="pf-phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} />
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
