"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentConfig } from "@puckeditor/core";

export type FormEmbedProps = {
  formSlug: string;
  heading: string;
};

function FormSlugField({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [forms, setForms] = useState<{ slug: string; name: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/forms/list")
      .then((r) => r.json())
      .then((data) => setForms(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <select disabled className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm opacity-50">
        <option>Loading forms...</option>
      </select>
    );
  }

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
    >
      <option value="">Select a form...</option>
      {forms.map((f) => (
        <option key={f.slug} value={f.slug}>
          {f.name} {f.status !== "published" ? `(${f.status})` : ""}
        </option>
      ))}
    </select>
  );
}

function AutoResizeIframe({ src }: { src: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "form-embed-resize" && typeof e.data.height === "number") {
        setHeight(e.data.height);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      className="w-full border-0 rounded-lg"
      style={{ height, overflow: "hidden" }}
      scrolling="no"
    />
  );
}

export const FormEmbedConfig: ComponentConfig<FormEmbedProps> = {
  fields: {
    formSlug: {
      type: "custom",
      render: ({ value, onChange }) => (
        <div className="space-y-1">
          <label className="text-xs font-medium">Form</label>
          <FormSlugField value={value} onChange={onChange} />
        </div>
      ),
    },
    heading: { type: "text" },
  },
  defaultProps: { formSlug: "", heading: "" },
  render: ({ formSlug, heading, puck }) => {
    const isEditing = puck?.isEditing;
    return (
      <section className="px-4 py-10 max-w-2xl mx-auto sm:px-6 sm:py-12">
        {heading && <h2 className="text-2xl font-bold text-center mb-6">{heading}</h2>}
        {isEditing ? (
          <div className="rounded-lg border-2 border-dashed border-brand-primary/30 p-8 text-center">
            <p className="text-sm font-medium text-brand-primary">Form Embed</p>
            <p className="text-xs text-muted-foreground mt-1">
              Slug: {formSlug || "(none set)"}
            </p>
          </div>
        ) : formSlug ? (
          <AutoResizeIframe src={`/f/${formSlug}?embed=true`} />
        ) : (
          <p className="text-center text-muted-foreground">No form configured.</p>
        )}
      </section>
    );
  },
};
