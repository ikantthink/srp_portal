"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PuckRenderer } from "@/lib/puck/renderer";
import type { Data } from "@puckeditor/core";
import { Loader2 } from "lucide-react";
import { FormFieldComponent, type FormField } from "./form-field-component";

interface PublicFormRendererProps {
  formId: string;
  versionId: string;
  schema: { fields: FormField[] };
  pageData: Record<string, unknown> | null;
  successPageData: Record<string, unknown> | null;
  settings: {
    success_behavior?: string;
    success_message?: string;
    redirect_url?: string;
  };
  isEmbed?: boolean;
}

export function PublicFormRenderer({
  formId,
  versionId,
  schema,
  pageData,
  successPageData,
  settings,
  isEmbed,
}: PublicFormRendererProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const postHeight = useCallback(() => {
    if (!isEmbed || !containerRef.current) return;
    const height = containerRef.current.scrollHeight;
    window.parent.postMessage({ type: "form-embed-resize", height }, "*");
  }, [isEmbed]);

  useEffect(() => {
    if (!isEmbed) return;
    postHeight();
    const observer = new ResizeObserver(postHeight);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isEmbed, postHeight, submitted]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    for (const field of schema.fields) {
      if (field.type === "heading" || field.type === "paragraph") continue;
      if (field.type === "checkbox") {
        data[field.id] = formData.get(field.id) === "on";
      } else if (field.type === "multi_select") {
        data[field.id] = formData.getAll(field.id);
      } else {
        data[field.id] = formData.get(field.id);
      }
    }

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_id: formId, version_id: versionId, data }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Submission failed");
      }

      setSubmissionData(data);

      if (settings.success_behavior === "redirect" && settings.redirect_url) {
        window.location.href = settings.redirect_url;
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    if (successPageData && settings.success_behavior === "show_page") {
      return (
        <div ref={containerRef} className={isEmbed ? "" : "min-h-screen"}>
          <PuckRenderer data={successPageData as Data} />
        </div>
      );
    }

    return (
      <div ref={containerRef} className={`flex items-center justify-center ${isEmbed ? "p-8" : "min-h-screen"}`}>
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">
            {settings.success_message || "Thank you for your submission!"}
          </h2>
        </div>
      </div>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4 p-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {schema.fields.map((field) => (
        <FormFieldComponent key={field.id} field={field} />
      ))}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit
      </Button>
    </form>
  );

  if (pageData && !isEmbed) {
    return (
      <div className="min-h-screen">
        <PuckRenderer data={pageData as Data} />
      </div>
    );
  }

  return <div ref={containerRef} className={isEmbed ? "" : "min-h-screen bg-background"}>{formContent}</div>;
}

