"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, Plus, Trash2, Settings } from "lucide-react";
import type { FormFieldType } from "@/types/database";

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
  settings: Record<string, unknown>;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

const fieldTypes: { value: FormFieldType; label: string }[] = [
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
  { value: "heading", label: "Heading" },
  { value: "paragraph", label: "Paragraph" },
];

export function FieldBuilder({ schema, onSchemaChange, settings, onSettingsChange }: FieldBuilderProps) {
  const fields = ((schema as any).fields || []) as FormField[];

  function updateFields(newFields: FormField[]) {
    onSchemaChange({ ...schema, fields: newFields });
  }

  function addField(type: FormFieldType) {
    const id = `field_${Date.now()}`;
    updateFields([...fields, { id, type, label: type === "heading" ? "Section Title" : `New ${type} field`, required: false }]);
  }

  function removeField(id: string) {
    updateFields(fields.filter((f) => f.id !== id));
  }

  function updateField(id: string, updates: Partial<FormField>) {
    updateFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function moveField(from: number, to: number) {
    const updated = [...fields];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    updateFields(updated);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Add Field</p>
        <div className="space-y-1">
          {fieldTypes.map((ft) => (
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

        <div className="mt-4 space-y-2 pt-4 border-t">
          <p className="text-sm font-medium">Settings</p>
          <div className="space-y-2">
            <Label htmlFor="success-msg">Success Message</Label>
            <Input
              id="success-msg"
              value={(settings.success_message as string) || ""}
              onChange={(e) => onSettingsChange({ ...settings, success_message: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-2">
        <p className="text-sm font-medium">Form Fields</p>
        {fields.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border p-12 text-center text-muted-foreground">
            Add fields from the palette on the left
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-2 rounded-lg border bg-card p-4"
              >
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => index > 0 && moveField(index, index - 1)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                      {field.type}
                    </span>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      />
                      Required
                    </label>
                    <Input
                      value={field.placeholder || ""}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      placeholder="Placeholder text..."
                      className="h-8 text-xs max-w-xs"
                    />
                  </div>
                  {(field.type === "select" || field.type === "multi_select" || field.type === "radio") && (
                    <Input
                      value={field.options?.join(", ") || ""}
                      onChange={(e) =>
                        updateField(field.id, {
                          options: e.target.value.split(",").map((o) => o.trim()),
                        })
                      }
                      placeholder="Options (comma-separated)"
                      className="h-8 text-xs"
                    />
                  )}
                </div>
                <button
                  onClick={() => removeField(field.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
