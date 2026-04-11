"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPage } from "@/actions/website";
import { Plus, X, Loader2 } from "lucide-react";

export function PageCreateForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await createPage(formData);
    setLoading(false);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> New Page
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create Page</h2>
          <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pg-title">Title</Label>
            <Input id="pg-title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pg-slug">URL Slug</Label>
            <Input id="pg-slug" name="slug" placeholder="about-us" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pg-meta">Meta Description</Label>
            <Input id="pg-meta" name="meta_description" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
