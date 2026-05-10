"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createLeadTag,
  updateLeadTag,
  deleteLeadTag,
} from "@/actions/lead-tags";
import {
  createWorkflowStage,
  updateWorkflowStage,
  deleteWorkflowStage,
  reorderWorkflowStages,
} from "@/actions/workflows";
import type { LeadTag, WorkflowStage } from "@/types/database";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Check } from "lucide-react";

const PRESET_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
  "#22c55e", "#06b6d4", "#6b7280", "#1d4ed8", "#b91c1c",
];

interface LeadSettingsProps {
  tags: LeadTag[];
  workflowId: string;
  stages: WorkflowStage[];
}

export function LeadSettings({ tags: initialTags, workflowId, stages: initialStages }: LeadSettingsProps) {
  const [tags, setTags] = useState(initialTags);
  const [stages, setStages] = useState(initialStages);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <TagManager tags={tags} onTagsChange={setTags} />
      <hr />
      <WorkflowManager
        workflowId={workflowId}
        stages={stages}
        onStagesChange={setStages}
      />
    </div>
  );
}

// --- Tag Manager ---

function TagManager({
  tags,
  onTagsChange,
}: {
  tags: LeadTag[];
  onTagsChange: (tags: LeadTag[]) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  async function handleCreate() {
    if (!name.trim()) return;
    const result = await createLeadTag(name.trim(), color);
    if (result.data) {
      onTagsChange([...tags, result.data as LeadTag]);
      setName("");
      setColor(PRESET_COLORS[0]);
      setCreating(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!name.trim()) return;
    const result = await updateLeadTag(id, name.trim(), color);
    if (!result.error) {
      onTagsChange(tags.map((t) => (t.id === id ? { ...t, name: name.trim(), color } : t)));
      setEditingId(null);
      setName("");
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteLeadTag(id);
    if (!result.error) {
      onTagsChange(tags.filter((t) => t.id !== id));
    }
  }

  function startEdit(tag: LeadTag) {
    setEditingId(tag.id);
    setName(tag.name);
    setColor(tag.color);
    setCreating(false);
  }

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setName("");
    setColor(PRESET_COLORS[0]);
  }

  function cancel() {
    setCreating(false);
    setEditingId(null);
    setName("");
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lead Tags</h3>
          <p className="text-sm text-muted-foreground">
            Categorize leads with colored tags.
          </p>
        </div>
        {!creating && !editingId && (
          <Button size="sm" onClick={startCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New Tag
          </Button>
        )}
      </div>

      {(creating || editingId) && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="space-y-2">
            <Label>Tag Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hot Lead"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  editingId ? handleUpdate(editingId) : handleCreate();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "currentColor" : "transparent",
                    transform: color === c ? "scale(1.15)" : undefined,
                  }}
                />
              ))}
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-24 text-xs"
                placeholder="#hex"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={cancel}>
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => (editingId ? handleUpdate(editingId) : handleCreate())}
            >
              <Check className="mr-1 h-3.5 w-3.5" /> {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {tags.length === 0 && !creating && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No tags yet. Create one to get started.
          </p>
        )}
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between rounded-lg border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-sm font-medium">{tag.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => startEdit(tag)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(tag.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Workflow Manager ---

function WorkflowManager({
  workflowId,
  stages,
  onStagesChange,
}: {
  workflowId: string;
  stages: WorkflowStage[];
  onStagesChange: (stages: WorkflowStage[]) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  async function handleCreate() {
    if (!name.trim()) return;
    const position = stages.length;
    const result = await createWorkflowStage(workflowId, name.trim(), color, position);
    if (result.data) {
      onStagesChange([...stages, result.data as WorkflowStage]);
      setName("");
      setColor(PRESET_COLORS[0]);
      setCreating(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!name.trim()) return;
    const result = await updateWorkflowStage(id, { name: name.trim(), color });
    if (!result.error) {
      onStagesChange(
        stages.map((s) => (s.id === id ? { ...s, name: name.trim(), color } : s))
      );
      setEditingId(null);
      setName("");
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteWorkflowStage(id);
    if (!result.error) {
      const updated = stages.filter((s) => s.id !== id);
      onStagesChange(updated);
    }
  }

  async function moveStage(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stages.length) return;
    const reordered = [...stages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, position: i }));
    onStagesChange(updated);
    await reorderWorkflowStages(workflowId, updated.map((s) => s.id));
  }

  function startEdit(stage: WorkflowStage) {
    setEditingId(stage.id);
    setName(stage.name);
    setColor(stage.color);
    setCreating(false);
  }

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setName("");
    setColor(PRESET_COLORS[0]);
  }

  function cancel() {
    setCreating(false);
    setEditingId(null);
    setName("");
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lead Workflow</h3>
          <p className="text-sm text-muted-foreground">
            Define the stages a lead moves through in your pipeline.
          </p>
        </div>
        {!creating && !editingId && (
          <Button size="sm" onClick={startCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New Stage
          </Button>
        )}
      </div>

      {(creating || editingId) && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="space-y-2">
            <Label>Stage Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Follow Up"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  editingId ? handleUpdate(editingId) : handleCreate();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "currentColor" : "transparent",
                    transform: color === c ? "scale(1.15)" : undefined,
                  }}
                />
              ))}
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-24 text-xs"
                placeholder="#hex"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={cancel}>
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => (editingId ? handleUpdate(editingId) : handleCreate())}
            >
              <Check className="mr-1 h-3.5 w-3.5" /> {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {stages.length === 0 && !creating && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No stages defined. Create stages for your lead pipeline.
          </p>
        )}
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className="flex items-center justify-between rounded-lg border px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveStage(index, -1)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => moveStage(index, 1)}
                  disabled={index === stages.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: stage.color }}
              >
                {stage.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => startEdit(stage)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(stage.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
