"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLinkCardVersion } from "@/actions/link-cards";
import type { Profile, LinkCardWidgetType, LinkCardLayout } from "@/types/database";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
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
import { LinkCardPreview } from "./link-card-preview";
import { ImageUploadField } from "./image-upload-field";

// ─── Widget shape ────────────────────────────────────────────

export interface Widget {
  id: string;
  type: LinkCardWidgetType;
  config: Record<string, string>;
  children?: Widget[];
}

// ─── Defaults ────────────────────────────────────────────────

const DEFAULT_LAYOUT: LinkCardLayout = {
  show_header: true,
  show_name: true,
  show_bio: true,
  show_avatar: true,
  header_bg_type: "gradient",
  header_gradient_from: "",
  header_gradient_to: "",
  header_bg_image: "",
  header_text_color: "#ffffff",
  avatar_size: "md",
  page_bg_color: "",
  card_bg_color: "",
  body_text_color: "",
};

function mergeLayout(raw: Record<string, unknown>): LinkCardLayout {
  return { ...DEFAULT_LAYOUT, ...raw } as LinkCardLayout;
}

// ─── Widget catalogue ────────────────────────────────────────

const widgetTypes: { type: LinkCardWidgetType; label: string }[] = [
  { type: "social_link", label: "Social Link" },
  { type: "button_link", label: "Button Link" },
  { type: "form_link", label: "Form Link" },
  { type: "image", label: "Image" },
  { type: "video_embed", label: "Video" },
  { type: "text_block", label: "Text" },
  { type: "contact_info", label: "Contact Info" },
  { type: "map_embed", label: "Map" },
  { type: "calendar_link", label: "Calendar" },
  { type: "newsletter_subscribe", label: "Newsletter Subscribe" },
  { type: "widget_group", label: "Group" },
];

// ─── Props ───────────────────────────────────────────────────

interface SimpleForm {
  id: string;
  name: string;
  slug: string;
}

interface LinkCardEditorProps {
  linkCardId: string;
  profile: Profile;
  initialWidgets: Record<string, unknown>[];
  initialLayout: Record<string, unknown>;
  forms?: SimpleForm[];
}

// ─── Main editor ─────────────────────────────────────────────

export function LinkCardEditor({
  linkCardId,
  profile,
  initialWidgets,
  initialLayout,
  forms = [],
}: LinkCardEditorProps) {
  const [widgets, setWidgets] = useState<Widget[]>(
    (initialWidgets as unknown as Widget[]) || []
  );
  const [layout, setLayout] = useState<LinkCardLayout>(mergeLayout(initialLayout));
  const [saving, setSaving] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);

  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function addWidget(type: LinkCardWidgetType) {
    const w: Widget = { id: `w_${Date.now()}`, type, config: {} };
    if (type === "widget_group") w.children = [];
    setWidgets((prev) => [...prev, w]);
  }

  function removeWidget(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }

  function updateWidgetConfig(id: string, key: string, value: string) {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, config: { ...w.config, [key]: value } } : w
      )
    );
  }

  function moveWidget(from: number, to: number) {
    setWidgets((prev) => arrayMove(prev, from, to));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setWidgets((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }

  function updateLayout<K extends keyof LinkCardLayout>(key: K, value: LinkCardLayout[K]) {
    setLayout((prev) => ({ ...prev, [key]: value }));
  }

  // ── Group child helpers ──

  function addChildWidget(groupId: string, type: LinkCardWidgetType) {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id !== groupId) return w;
        const child: Widget = { id: `w_${Date.now()}`, type, config: {} };
        return { ...w, children: [...(w.children || []), child] };
      })
    );
  }

  function removeChildWidget(groupId: string, childId: string) {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id !== groupId) return w;
        return { ...w, children: (w.children || []).filter((c) => c.id !== childId) };
      })
    );
  }

  function updateChildConfig(groupId: string, childId: string, key: string, value: string) {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id !== groupId) return w;
        return {
          ...w,
          children: (w.children || []).map((c) =>
            c.id === childId ? { ...c, config: { ...c.config, [key]: value } } : c
          ),
        };
      })
    );
  }

  function moveChildWidget(groupId: string, from: number, to: number) {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id !== groupId) return w;
        const kids = [...(w.children || [])];
        const [moved] = kids.splice(from, 1);
        kids.splice(to, 0, moved);
        return { ...w, children: kids };
      })
    );
  }

  async function handleSave() {
    setSaving(true);
    await saveLinkCardVersion(linkCardId, {
      layout: layout as unknown as Record<string, unknown>,
      widgets: widgets as unknown as Record<string, unknown>[],
    });
    setSaving(false);
  }

  return (
    <div className="relative">
      <div className="lg:mr-[400px]">
        <div className="space-y-4">
          {/* ── Top bar ── */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Widgets</h2>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1 h-3.5 w-3.5" />
              )}
              Publish
            </Button>
          </div>

          {/* ── Layout / Header settings ── */}
          <div className="rounded-lg border bg-card">
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-sm font-medium"
              onClick={() => setLayoutOpen(!layoutOpen)}
            >
              Appearance Settings
              {layoutOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {layoutOpen && (
              <div className="border-t p-4 space-y-3">
                {/* ── Page & Card colors ── */}
                <p className="text-xs font-medium text-muted-foreground pt-1">Page &amp; Card</p>
                <div className="grid grid-cols-3 gap-3">
                  <ColorField
                    label="Page Background"
                    value={layout.page_bg_color || "#f3f4f6"}
                    onChange={(v) => updateLayout("page_bg_color", v)}
                  />
                  <ColorField
                    label="Card Background"
                    value={layout.card_bg_color || "#ffffff"}
                    onChange={(v) => updateLayout("card_bg_color", v)}
                  />
                  <ColorField
                    label="Body Text"
                    value={layout.body_text_color || "#1a1a2e"}
                    onChange={(v) => updateLayout("body_text_color", v)}
                  />
                </div>

                {/* ── Header settings ── */}
                <p className="text-xs font-medium text-muted-foreground pt-2">Header</p>
                <CheckboxField
                  label="Show Header"
                  checked={layout.show_header}
                  onChange={(v) => updateLayout("show_header", v)}
                />
                {layout.show_header && (
                  <>
                    <CheckboxField
                      label="Show Avatar"
                      checked={layout.show_avatar}
                      onChange={(v) => updateLayout("show_avatar", v)}
                    />
                    <CheckboxField
                      label="Show Name"
                      checked={layout.show_name}
                      onChange={(v) => updateLayout("show_name", v)}
                    />
                    <CheckboxField
                      label="Show Bio"
                      checked={layout.show_bio}
                      onChange={(v) => updateLayout("show_bio", v)}
                    />

                    <div>
                      <Label className="text-xs">Avatar Size</Label>
                      <NativeSelect
                        value={layout.avatar_size}
                        onChange={(v) => updateLayout("avatar_size", v as LinkCardLayout["avatar_size"])}
                        options={[
                          { value: "sm", label: "Small" },
                          { value: "md", label: "Medium" },
                          { value: "lg", label: "Large" },
                          { value: "xl", label: "Extra Large" },
                        ]}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Background Type</Label>
                      <NativeSelect
                        value={layout.header_bg_type}
                        onChange={(v) => updateLayout("header_bg_type", v as "gradient" | "image")}
                        options={[
                          { value: "gradient", label: "Gradient" },
                          { value: "image", label: "Image" },
                        ]}
                      />
                    </div>

                    {layout.header_bg_type === "gradient" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <ColorField
                          label="Gradient From"
                          value={layout.header_gradient_from || "#1a365d"}
                          onChange={(v) => updateLayout("header_gradient_from", v)}
                        />
                        <ColorField
                          label="Gradient To"
                          value={layout.header_gradient_to || "#2d3748"}
                          onChange={(v) => updateLayout("header_gradient_to", v)}
                        />
                      </div>
                    ) : (
                      <ImageUploadField
                        label="Background Image"
                        id="header-bg"
                        currentUrl={layout.header_bg_image || null}
                        onUploaded={(url) => updateLayout("header_bg_image", url)}
                        onRemoved={() => updateLayout("header_bg_image", "")}
                      />
                    )}

                    <ColorField
                      label="Header Text Color"
                      value={layout.header_text_color || "#ffffff"}
                      onChange={(v) => updateLayout("header_text_color", v)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Add widget buttons ── */}
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

          {/* ── Widget list ── */}
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgets.map((w) => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {widgets.map((widget, index) => (
                  <SortableWidgetCard
                    key={widget.id}
                    widget={widget}
                    index={index}
                    totalWidgets={widgets.length}
                    onMoveUp={() => moveWidget(index, index - 1)}
                    onMoveDown={() => moveWidget(index, index + 1)}
                    onRemove={() => removeWidget(widget.id)}
                    onUpdateConfig={updateWidgetConfig}
                    onAddChild={addChildWidget}
                    onRemoveChild={removeChildWidget}
                    onUpdateChildConfig={updateChildConfig}
                    onMoveChild={moveChildWidget}
                    forms={forms}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <div className="hidden lg:block fixed top-20 bottom-6 right-6 w-[384px] overflow-y-auto">
        <LinkCardPreview profile={profile} widgets={widgets} layout={layout} />
      </div>
    </div>
  );
}

// ─── Sortable widget card ─────────────────────────────────────

function SortableWidgetCard({
  widget,
  index,
  totalWidgets,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpdateConfig,
  onAddChild,
  onRemoveChild,
  onUpdateChildConfig,
  onMoveChild,
  forms,
}: {
  widget: Widget;
  index: number;
  totalWidgets: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUpdateConfig: (id: string, key: string, value: string) => void;
  onAddChild: (groupId: string, type: LinkCardWidgetType) => void;
  onRemoveChild: (groupId: string, childId: string) => void;
  onUpdateChildConfig: (groupId: string, childId: string, key: string, value: string) => void;
  onMoveChild: (groupId: string, from: number, to: number) => void;
  forms: SimpleForm[];
}) {
  const [collapsed, setCollapsed] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const summary = getWidgetSummary(widget);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-card"
      {...attributes}
    >
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            ref={setActivatorNodeRef}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          {collapsed ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium capitalize shrink-0">
            {widget.type.replace(/_/g, " ")}
          </span>
          {collapsed && summary && (
            <span className="text-xs text-muted-foreground truncate">{summary}</span>
          )}
        </div>
        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onMoveUp}
            className="text-xs text-muted-foreground hover:text-foreground"
            disabled={index === 0}
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            className="text-xs text-muted-foreground hover:text-foreground"
            disabled={index === totalWidgets - 1}
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 pt-1 space-y-2">
          {widget.type === "widget_group" ? (
            <WidgetGroupFields
              widget={widget}
              onUpdateConfig={onUpdateConfig}
              onAddChild={onAddChild}
              onRemoveChild={onRemoveChild}
              onUpdateChildConfig={onUpdateChildConfig}
              onMoveChild={onMoveChild}
              forms={forms}
            />
          ) : (
            <WidgetConfigFields
              widget={widget}
              onUpdate={onUpdateConfig}
              forms={forms}
            />
          )}
        </div>
      )}
    </div>
  );
}

function getWidgetSummary(widget: Widget): string {
  const c = widget.config;
  switch (widget.type) {
    case "social_link":
      return c.platform || "";
    case "button_link":
      return c.label || c.url || "";
    case "form_link":
      return c.label || "";
    case "text_block":
      return c.text ? c.text.slice(0, 40) : "";
    case "contact_info":
      return [c.phone, c.email].filter(Boolean).join(", ");
    case "image":
      return c.url ? "Image set" : "";
    case "video_embed":
      return c.url || "";
    case "calendar_link":
      return c.url || "";
    case "map_embed":
      return c.address || "";
    case "newsletter_subscribe":
      return c.heading || "";
    case "widget_group":
      return `${(widget.children || []).length} children`;
    default:
      return "";
  }
}

// ─── Widget config fields per type ───────────────────────────

function WidgetConfigFields({
  widget,
  onUpdate,
  forms,
}: {
  widget: Widget;
  onUpdate: (id: string, key: string, value: string) => void;
  forms: SimpleForm[];
}) {
  switch (widget.type) {
    case "social_link":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Platform</Label>
            <NativeSelect
              value={widget.config.platform || ""}
              onChange={(v) => onUpdate(widget.id, "platform", v)}
              options={[
                { value: "", label: "Select platform..." },
                { value: "Instagram", label: "Instagram" },
                { value: "Facebook", label: "Facebook" },
                { value: "Twitter", label: "Twitter / X" },
                { value: "LinkedIn", label: "LinkedIn" },
                { value: "YouTube", label: "YouTube" },
                { value: "TikTok", label: "TikTok" },
                { value: "GitHub", label: "GitHub" },
                { value: "Pinterest", label: "Pinterest" },
                { value: "Snapchat", label: "Snapchat" },
                { value: "WhatsApp", label: "WhatsApp" },
                { value: "Other", label: "Other" },
              ]}
            />
          </div>
          <TextField
            label="URL"
            value={widget.config.url}
            placeholder="https://..."
            onChange={(v) => onUpdate(widget.id, "url", v)}
          />
          <CheckboxField
            label="Display as icon"
            checked={widget.config.display_as_icon === "true"}
            onChange={(v) => onUpdate(widget.id, "display_as_icon", String(v))}
          />
          <CheckboxField
            label="Rounded"
            checked={widget.config.rounded !== "false"}
            onChange={(v) => onUpdate(widget.id, "rounded", String(v))}
          />
          <CheckboxField
            label="Open in new tab"
            checked={widget.config.open_new_tab !== "false"}
            onChange={(v) => onUpdate(widget.id, "open_new_tab", String(v))}
          />
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Background"
              value={widget.config.bg_color || "#f3f4f6"}
              onChange={(v) => onUpdate(widget.id, "bg_color", v)}
            />
            <ColorField
              label="Text"
              value={widget.config.text_color || "#000000"}
              onChange={(v) => onUpdate(widget.id, "text_color", v)}
            />
            <ColorField
              label="Hover Background"
              value={widget.config.hover_color || "#e5e7eb"}
              onChange={(v) => onUpdate(widget.id, "hover_color", v)}
            />
            <ColorField
              label="Hover Text"
              value={widget.config.hover_text_color || ""}
              onChange={(v) => onUpdate(widget.id, "hover_text_color", v)}
            />
          </div>
        </div>
      );

    case "button_link":
      return (
        <div className="space-y-2">
          <TextField
            label="Label"
            value={widget.config.label}
            placeholder="Click me"
            onChange={(v) => onUpdate(widget.id, "label", v)}
          />
          <TextField
            label="URL"
            value={widget.config.url}
            placeholder="https://..."
            onChange={(v) => onUpdate(widget.id, "url", v)}
          />
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Background Color"
              value={widget.config.bg_color || ""}
              onChange={(v) => onUpdate(widget.id, "bg_color", v)}
            />
            <ColorField
              label="Text Color"
              value={widget.config.text_color || "#ffffff"}
              onChange={(v) => onUpdate(widget.id, "text_color", v)}
            />
          </div>
          <div>
            <Label className="text-xs">Border Radius</Label>
            <NativeSelect
              value={widget.config.border_radius || "lg"}
              onChange={(v) => onUpdate(widget.id, "border_radius", v)}
              options={[
                { value: "none", label: "None" },
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
                { value: "full", label: "Pill" },
              ]}
            />
          </div>
          <CheckboxField
            label="Open in new tab"
            checked={widget.config.open_new_tab === "true"}
            onChange={(v) => onUpdate(widget.id, "open_new_tab", String(v))}
          />
        </div>
      );

    case "form_link":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Form</Label>
            <NativeSelect
              value={widget.config.form_id || ""}
              onChange={(v) => {
                onUpdate(widget.id, "form_id", v);
                const form = forms.find((f) => f.id === v);
                if (form) {
                  onUpdate(widget.id, "form_slug", form.slug);
                  if (!widget.config.label) {
                    onUpdate(widget.id, "label", form.name);
                  }
                }
              }}
              options={[
                { value: "", label: "Select a form..." },
                ...forms.map((f) => ({ value: f.id, label: f.name })),
              ]}
            />
          </div>
          <TextField
            label="Button Label"
            value={widget.config.label}
            placeholder="Open Form"
            onChange={(v) => onUpdate(widget.id, "label", v)}
          />
          <CheckboxField
            label="Open in new tab"
            checked={widget.config.open_new_tab === "true"}
            onChange={(v) => onUpdate(widget.id, "open_new_tab", String(v))}
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          <ImageUploadField
            label="Image"
            id={`img-${widget.id}`}
            currentUrl={widget.config.url || null}
            onUploaded={(url) => onUpdate(widget.id, "url", url)}
            onRemoved={() => onUpdate(widget.id, "url", "")}
          />
          <TextField
            label="Or paste URL"
            value={widget.config.url}
            placeholder="https://..."
            onChange={(v) => onUpdate(widget.id, "url", v)}
          />
          <TextField
            label="Height (px)"
            value={widget.config.height}
            placeholder="300"
            onChange={(v) => onUpdate(widget.id, "height", v)}
          />
          <div>
            <Label className="text-xs">Object Fit</Label>
            <NativeSelect
              value={widget.config.object_fit || "cover"}
              onChange={(v) => onUpdate(widget.id, "object_fit", v)}
              options={[
                { value: "cover", label: "Cover" },
                { value: "contain", label: "Contain" },
                { value: "fill", label: "Fill" },
              ]}
            />
          </div>
          <CheckboxField
            label="Parallax effect"
            checked={widget.config.parallax === "true"}
            onChange={(v) => onUpdate(widget.id, "parallax", String(v))}
          />
        </div>
      );

    case "video_embed":
      return (
        <TextField
          label="Video URL"
          value={widget.config.url}
          placeholder="https://youtube.com/..."
          onChange={(v) => onUpdate(widget.id, "url", v)}
        />
      );

    case "text_block":
      return (
        <TextField
          label="Text"
          value={widget.config.text}
          placeholder="Your text here"
          onChange={(v) => onUpdate(widget.id, "text", v)}
        />
      );

    case "contact_info":
      return (
        <div className="space-y-2">
          <TextField
            label="Phone"
            value={widget.config.phone}
            placeholder="(555) 123-4567"
            onChange={(v) => onUpdate(widget.id, "phone", v)}
          />
          <TextField
            label="Email"
            value={widget.config.email}
            placeholder="agent@srp.com"
            onChange={(v) => onUpdate(widget.id, "email", v)}
          />
        </div>
      );

    case "map_embed":
      return (
        <TextField
          label="Address"
          value={widget.config.address}
          placeholder="123 Main St"
          onChange={(v) => onUpdate(widget.id, "address", v)}
        />
      );

    case "calendar_link":
      return (
        <div className="space-y-2">
          <TextField
            label="Calendar URL"
            value={widget.config.url}
            placeholder="https://calendly.com/..."
            onChange={(v) => onUpdate(widget.id, "url", v)}
          />
          <CheckboxField
            label="Open in new tab"
            checked={widget.config.open_new_tab === "true"}
            onChange={(v) => onUpdate(widget.id, "open_new_tab", String(v))}
          />
        </div>
      );

    case "newsletter_subscribe":
      return (
        <div className="space-y-2">
          <TextField
            label="Heading"
            value={widget.config.heading}
            placeholder="Stay Updated"
            onChange={(v) => onUpdate(widget.id, "heading", v)}
          />
          <TextField
            label="Description"
            value={widget.config.description}
            placeholder="Get market updates"
            onChange={(v) => onUpdate(widget.id, "description", v)}
          />
        </div>
      );

    default:
      return null;
  }
}

// ─── Widget group ────────────────────────────────────────────

const groupableTypes: { type: LinkCardWidgetType; label: string }[] = widgetTypes.filter(
  (wt) => wt.type !== "widget_group"
);

function WidgetGroupFields({
  widget,
  onUpdateConfig,
  onAddChild,
  onRemoveChild,
  onUpdateChildConfig,
  onMoveChild,
  forms,
}: {
  widget: Widget;
  onUpdateConfig: (id: string, key: string, value: string) => void;
  onAddChild: (groupId: string, type: LinkCardWidgetType) => void;
  onRemoveChild: (groupId: string, childId: string) => void;
  onUpdateChildConfig: (groupId: string, childId: string, key: string, value: string) => void;
  onMoveChild: (groupId: string, from: number, to: number) => void;
  forms: SimpleForm[];
}) {
  const children = widget.children || [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Alignment</Label>
          <NativeSelect
            value={widget.config.alignment || "center"}
            onChange={(v) => onUpdateConfig(widget.id, "alignment", v)}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
        </div>
        <div>
          <Label className="text-xs">Spacing</Label>
          <NativeSelect
            value={widget.config.gap || "2"}
            onChange={(v) => onUpdateConfig(widget.id, "gap", v)}
            options={[
              { value: "1", label: "Tight" },
              { value: "2", label: "Normal" },
              { value: "4", label: "Relaxed" },
              { value: "6", label: "Loose" },
            ]}
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Direction</Label>
        <NativeSelect
          value={widget.config.direction || "row"}
          onChange={(v) => onUpdateConfig(widget.id, "direction", v)}
          options={[
            { value: "row", label: "Horizontal" },
            { value: "column", label: "Vertical" },
          ]}
        />
      </div>

      <div className="rounded border border-dashed p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Children ({children.length})
        </p>

        {children.map((child, idx) => (
          <div key={child.id} className="rounded border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium capitalize">
                {child.type.replace(/_/g, " ")}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => idx > 0 && onMoveChild(widget.id, idx, idx - 1)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  disabled={idx === 0}
                >
                  ↑
                </button>
                <button
                  onClick={() =>
                    idx < children.length - 1 && onMoveChild(widget.id, idx, idx + 1)
                  }
                  className="text-xs text-muted-foreground hover:text-foreground"
                  disabled={idx === children.length - 1}
                >
                  ↓
                </button>
                <button
                  onClick={() => onRemoveChild(widget.id, child.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <WidgetConfigFields
              widget={child}
              onUpdate={(_, key, value) =>
                onUpdateChildConfig(widget.id, child.id, key, value)
              }
              forms={forms}
            />
          </div>
        ))}

        <div className="flex flex-wrap gap-1 pt-1">
          {groupableTypes.map((wt) => (
            <Button
              key={wt.type}
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onAddChild(widget.id, wt.type)}
            >
              <Plus className="mr-1 h-2.5 w-2.5" /> {wt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared field components ─────────────────────────────────

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string | undefined;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border p-0.5"
        />
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="h-8 text-sm flex-1"
        />
      </div>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-border"
      />
      {label}
    </label>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-8 w-full rounded-lg border border-border bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
