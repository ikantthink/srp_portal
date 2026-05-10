"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Pilcrow,
} from "lucide-react";
import type { FormFieldType } from "@/types/database";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormPreview } from "./form-preview";

interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  show_when?: { field_id: string; operator: string; value: string } | null;
}

interface FieldBuilderProps {
  schema: Record<string, unknown>;
  onSchemaChange: (schema: Record<string, unknown>) => void;
}

const inputFieldTypes: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown" },
  { value: "multi_select", label: "Multi Select" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "file_upload", label: "File Upload" },
  { value: "address", label: "Address" },
];

const layoutFieldTypes: { value: FormFieldType; label: string; icon: typeof Type }[] = [
  { value: "heading", label: "Heading", icon: Type },
  { value: "paragraph", label: "Paragraph", icon: Pilcrow },
];

const isLayoutField = (type: string) => type === "heading" || type === "paragraph";

export function FieldBuilder({ schema, onSchemaChange }: FieldBuilderProps) {
  const fields = ((schema as Record<string, unknown>).fields || []) as FormField[];

  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function updateFields(newFields: FormField[]) {
    onSchemaChange({ ...schema, fields: newFields });
  }

  function addField(type: FormFieldType) {
    const id = `field_${Date.now()}`;
    const label =
      type === "heading"
        ? "Section Title"
        : type === "paragraph"
          ? "Enter paragraph text here..."
          : `New ${type} field`;
    updateFields([...fields, { id, type, label, required: false }]);
  }

  function removeField(id: string) {
    updateFields(fields.filter((f) => f.id !== id));
  }

  function updateField(id: string, updates: Partial<FormField>) {
    updateFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function moveField(from: number, to: number) {
    if (to < 0 || to >= fields.length) return;
    updateFields(arrayMove(fields, from, to));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      updateFields(arrayMove(fields, oldIndex, newIndex));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr_320px]">
      {/* Left sidebar: palette + settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layout</p>
          <div className="space-y-1">
            {layoutFieldTypes.map((ft) => (
              <button
                key={ft.value}
                onClick={() => addField(ft.value)}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <ft.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Form Fields</p>
          <div className="space-y-1">
            {inputFieldTypes.map((ft) => (
              <button
                key={ft.value}
                onClick={() => addField(ft.value)}
                className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                {ft.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Center: field editor with drag-and-drop */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Form Fields</p>
        {fields.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border p-12 text-center text-muted-foreground">
            Add fields from the palette on the left
          </div>
        ) : (
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <SortableFieldCard
                    key={field.id}
                    field={field}
                    index={index}
                    totalFields={fields.length}
                    onUpdate={(updates) => updateField(field.id, updates)}
                    onRemove={() => removeField(field.id)}
                    onMoveUp={() => moveField(index, index - 1)}
                    onMoveDown={() => moveField(index, index + 1)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Right panel: live preview */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Preview</p>
        <div className="rounded-lg border bg-background p-4 sticky top-4">
          <FormPreview fields={fields} />
        </div>
      </div>
    </div>
  );
}

interface SortableFieldCardProps {
  field: FormField;
  index: number;
  totalFields: number;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableFieldCard({
  field,
  index,
  totalFields,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SortableFieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const layout = isLayoutField(field.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-lg border bg-card p-4"
      {...attributes}
    >
      <div className="flex flex-col gap-0.5 pt-1">
        <button
          ref={setActivatorNodeRef}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Move up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === totalFields - 1}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Move down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
            {field.type}
          </span>
          {field.type === "paragraph" ? (
            <Textarea
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="min-h-[60px] text-sm"
              rows={2}
            />
          ) : (
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="h-8 text-sm"
            />
          )}
        </div>

        {!layout && (
          <>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                />
                Required
              </label>
              <Input
                value={field.placeholder || ""}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder="Placeholder text..."
                className="h-8 text-xs max-w-xs"
              />
            </div>
            {(field.type === "select" || field.type === "multi_select" || field.type === "radio") && (
              <OptionsEditor
                options={field.options || []}
                onChange={(options) => onUpdate({ options })}
              />
            )}
          </>
        )}
      </div>

      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  function updateOption(index: number, value: string) {
    const next = [...options];
    next[index] = value;
    onChange(next);
  }

  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }

  function addOption() {
    onChange([...options, ""]);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Options</p>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
            className="h-7 text-xs"
          />
          <button
            type="button"
            onClick={() => removeOption(i)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3 w-3" /> Add option
      </button>
    </div>
  );
}
