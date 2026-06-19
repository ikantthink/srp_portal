"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createBlockPreset,
  updateBlockPreset,
  deleteBlockPreset,
  type BlockPreset,
} from "@/actions/block-presets";
import { Pencil, Trash2, Plus, Folder, X, Blocks } from "lucide-react";
import { BlockPreview } from "@/components/portal/settings/block-preview";

export interface DefaultBlock {
  type: string;
  label: string;
  defaultProps: Record<string, unknown>;
}

interface BlockPresetsManagerProps {
  initialPresets: BlockPreset[];
  componentTypes: string[];
  defaultBlocks?: DefaultBlock[];
}

export function BlockPresetsManager({
  initialPresets,
  componentTypes,
  defaultBlocks = [],
}: BlockPresetsManagerProps) {
  const [presets, setPresets] = useState(initialPresets);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const folders = Array.from(new Set(presets.map((p) => p.folder))).sort();

  const filtered = filter
    ? presets.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          p.component_type.toLowerCase().includes(filter.toLowerCase()) ||
          p.folder.toLowerCase().includes(filter.toLowerCase())
      )
    : presets;

  const grouped = folders.reduce(
    (acc, folder) => {
      const items = filtered.filter((p) => p.folder === folder);
      if (items.length > 0) acc[folder] = items;
      return acc;
    },
    {} as Record<string, BlockPreset[]>
  );

  async function handleDelete(id: string) {
    if (!confirm("Delete this preset?")) return;
    const result = await deleteBlockPreset(id);
    if (!result.error) {
      setPresets((prev) => prev.filter((p) => p.id !== id));
    }
  }

  const filterTerm = filter.trim().toLowerCase();
  const filteredDefaults = filterTerm
    ? defaultBlocks.filter(
        (b) =>
          b.type.toLowerCase().includes(filterTerm) ||
          b.label.toLowerCase().includes(filterTerm)
      )
    : defaultBlocks;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Search blocks and presets..."
          value={filter}
          onChange={setFilter}
          className="max-w-xs"
        />
        <Button onClick={() => setShowCreate(true)} className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Preset
        </Button>
      </div>

      {showCreate && (
        <PresetForm
          componentTypes={componentTypes}
          existingFolders={folders}
          onClose={() => setShowCreate(false)}
          onSaved={(preset) => {
            setPresets((prev) => [...prev, preset]);
            setShowCreate(false);
          }}
        />
      )}

      {filteredDefaults.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Blocks className="h-4 w-4" />
            Default Blocks
          </div>
          <p className="text-xs text-muted-foreground">
            Built-in page-builder components. Themed using your website settings.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDefaults.map((block) => (
              <div
                key={block.type}
                className="space-y-2 rounded-lg border bg-card p-3"
              >
                <BlockPreview type={block.type} props={block.defaultProps} />
                <div>
                  <p className="text-sm font-medium">{block.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Base: {block.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Folder className="h-4 w-4" />
          Saved Presets
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
            {presets.length === 0
              ? "No presets yet. Create one to save a configured block for reuse."
              : "No presets match your search."}
          </div>
        ) : (
          Object.entries(grouped).map(([folder, items]) => (
            <div key={folder} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Folder className="h-3.5 w-3.5" />
                {folder}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((preset) =>
                  editingId === preset.id ? (
                    <PresetForm
                      key={preset.id}
                      componentTypes={componentTypes}
                      existingFolders={folders}
                      preset={preset}
                      onClose={() => setEditingId(null)}
                      onSaved={(updated) => {
                        setPresets((prev) =>
                          prev.map((p) => (p.id === updated.id ? updated : p))
                        );
                        setEditingId(null);
                      }}
                    />
                  ) : (
                    <div
                      key={preset.id}
                      className="space-y-2 rounded-lg border bg-card p-3"
                    >
                      <BlockPreview
                        type={preset.component_type}
                        props={preset.props}
                      />
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate text-sm font-medium">
                            {preset.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            Base: {preset.component_type}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => setEditingId(preset.id)}
                            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(preset.id)}
                            className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-muted"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface PresetFormProps {
  componentTypes: string[];
  existingFolders: string[];
  preset?: BlockPreset;
  onClose: () => void;
  onSaved: (preset: BlockPreset) => void;
}

function PresetForm({
  componentTypes,
  existingFolders,
  preset,
  onClose,
  onSaved,
}: PresetFormProps) {
  const isEditing = !!preset;
  const [name, setName] = useState(preset?.name || "");
  const [componentType, setComponentType] = useState(preset?.component_type || componentTypes[0] || "");
  const [folder, setFolder] = useState(preset?.folder || "Custom");
  const [propsJson, setPropsJson] = useState(
    preset ? JSON.stringify(preset.props, null, 2) : "{}"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(propsJson);
    } catch {
      setError("Invalid JSON in props field");
      return;
    }

    setSaving(true);
    if (isEditing) {
      const result = await updateBlockPreset(preset.id, {
        name,
        folder,
        props: parsed,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onSaved({ ...preset, name, folder, props: parsed });
      }
    } else {
      const result = await createBlockPreset({
        name,
        component_type: componentType,
        folder,
        props: parsed,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        onSaved(result.data);
      }
    }
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-4 space-y-3 sm:col-span-2 lg:col-span-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {isEditing ? "Edit Preset" : "New Preset"}
        </p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="My Custom Hero"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Component Type</Label>
          {isEditing ? (
            <Input value={componentType} disabled />
          ) : (
            <select
              value={componentType}
              onChange={(e) => setComponentType(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {componentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Folder</Label>
          <Input
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            required
            placeholder="Custom"
            list="folder-suggestions"
          />
          <datalist id="folder-suggestions">
            {existingFolders.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Default Props (JSON)</Label>
        <Textarea
          value={propsJson}
          onChange={(e) => setPropsJson(e.target.value)}
          rows={4}
          className="font-mono text-xs"
          placeholder='{ "title": "My Title", "theme": "dark" }'
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Saving..." : isEditing ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
