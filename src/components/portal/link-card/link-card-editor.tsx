"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLinkCardVersion } from "@/actions/link-cards";
import type { Profile, LinkCardWidgetType } from "@/types/database";
import { Plus, Trash2, Save, Loader2, Eye } from "lucide-react";
import { LinkCardPreview } from "./link-card-preview";

interface Widget {
  id: string;
  type: LinkCardWidgetType;
  config: Record<string, string>;
}

const widgetTypes: { type: LinkCardWidgetType; label: string }[] = [
  { type: "social_link", label: "Social Link" },
  { type: "form_link", label: "Form Link" },
  { type: "image", label: "Image" },
  { type: "video_embed", label: "Video" },
  { type: "text_block", label: "Text" },
  { type: "contact_info", label: "Contact Info" },
  { type: "map_embed", label: "Map" },
  { type: "calendar_link", label: "Calendar" },
  { type: "newsletter_subscribe", label: "Newsletter Subscribe" },
];

interface LinkCardEditorProps {
  linkCardId: string;
  profile: Profile;
  initialWidgets: Record<string, unknown>[];
  initialLayout: Record<string, unknown>;
}

export function LinkCardEditor({
  linkCardId,
  profile,
  initialWidgets,
  initialLayout,
}: LinkCardEditorProps) {
  const [widgets, setWidgets] = useState<Widget[]>(
    (initialWidgets as unknown as Widget[]) || []
  );
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  function addWidget(type: LinkCardWidgetType) {
    setWidgets([
      ...widgets,
      { id: `w_${Date.now()}`, type, config: {} },
    ]);
  }

  function removeWidget(id: string) {
    setWidgets(widgets.filter((w) => w.id !== id));
  }

  function updateWidgetConfig(id: string, key: string, value: string) {
    setWidgets(
      widgets.map((w) =>
        w.id === id ? { ...w, config: { ...w.config, [key]: value } } : w
      )
    );
  }

  function moveWidget(from: number, to: number) {
    const updated = [...widgets];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setWidgets(updated);
  }

  async function handleSave() {
    setSaving(true);
    await saveLinkCardVersion(linkCardId, {
      layout: initialLayout as Record<string, unknown>,
      widgets: widgets as unknown as Record<string, unknown>[],
    });
    setSaving(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Widgets</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
              Publish
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {widgetTypes.map((wt) => (
            <Button
              key={wt.type}
              variant="outline"
              size="sm"
              onClick={() => addWidget(wt.type)}
            >
              <Plus className="mr-1 h-3 w-3" /> {wt.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {widgets.map((widget, index) => (
            <div key={widget.id} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                  {widget.type.replace("_", " ")}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => index > 0 && moveWidget(index, index - 1)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => index < widgets.length - 1 && moveWidget(index, index + 1)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    disabled={index === widgets.length - 1}
                  >
                    ↓
                  </button>
                  <button onClick={() => removeWidget(widget.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <WidgetConfigFields widget={widget} onUpdate={updateWidgetConfig} />
            </div>
          ))}
        </div>
      </div>

      {showPreview && (
        <div className="sticky top-20">
          <LinkCardPreview profile={profile} widgets={widgets} />
        </div>
      )}
    </div>
  );
}

function WidgetConfigFields({
  widget,
  onUpdate,
}: {
  widget: Widget;
  onUpdate: (id: string, key: string, value: string) => void;
}) {
  const fields: { key: string; label: string; placeholder: string }[] = (() => {
    switch (widget.type) {
      case "social_link":
        return [
          { key: "platform", label: "Platform", placeholder: "Instagram, Facebook, etc." },
          { key: "url", label: "URL", placeholder: "https://..." },
        ];
      case "form_link":
        return [
          { key: "label", label: "Label", placeholder: "Contact Form" },
          { key: "url", label: "Form URL", placeholder: "/f/abc123" },
        ];
      case "image":
        return [{ key: "url", label: "Image URL", placeholder: "https://..." }];
      case "video_embed":
        return [{ key: "url", label: "Video URL", placeholder: "https://youtube.com/..." }];
      case "text_block":
        return [{ key: "text", label: "Text", placeholder: "Your text here" }];
      case "contact_info":
        return [
          { key: "phone", label: "Phone", placeholder: "(555) 123-4567" },
          { key: "email", label: "Email", placeholder: "agent@srp.com" },
        ];
      case "map_embed":
        return [{ key: "address", label: "Address", placeholder: "123 Main St" }];
      case "calendar_link":
        return [{ key: "url", label: "Calendar URL", placeholder: "https://calendly.com/..." }];
      case "newsletter_subscribe":
        return [
          { key: "heading", label: "Heading", placeholder: "Stay Updated" },
          { key: "description", label: "Description", placeholder: "Get market updates" },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className="space-y-2">
      {fields.map((f) => (
        <div key={f.key}>
          <Label className="text-xs">{f.label}</Label>
          <Input
            value={widget.config[f.key] || ""}
            onChange={(e) => onUpdate(widget.id, f.key, e.target.value)}
            placeholder={f.placeholder}
            className="h-8 text-sm"
          />
        </div>
      ))}
    </div>
  );
}
