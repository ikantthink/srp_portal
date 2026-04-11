"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldBuilder } from "./field-builder";
import { PuckEditor } from "@/lib/puck/editor-wrapper";
import { saveFormVersion, publishForm } from "@/actions/forms";
import type { FormVersion, FormSubmission } from "@/types/database";
import type { Data } from "@puckeditor/core";
import { Loader2 } from "lucide-react";

type Tab = "fields" | "landing_page" | "success_page" | "submissions";

interface FormBuilderTabsProps {
  formId: string;
  formStatus: string;
  version: FormVersion | null;
  submissions: FormSubmission[];
}

export function FormBuilderTabs({
  formId,
  formStatus,
  version,
  submissions,
}: FormBuilderTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("fields");
  const [schema, setSchema] = useState<Record<string, unknown>>(
    version?.schema || { fields: [] }
  );
  const [pageData, setPageData] = useState<Data | null>(
    version?.page_data as Data | null
  );
  const [successPageData, setSuccessPageData] = useState<Data | null>(
    version?.success_page_data as Data | null
  );
  const [settings, setSettings] = useState<Record<string, unknown>>(
    version?.settings || { success_behavior: "message", success_message: "Thank you!" }
  );
  const [saving, setSaving] = useState(false);

  const tabs: { key: Tab; label: string }[] = [
    { key: "fields", label: "Fields" },
    { key: "landing_page", label: "Landing Page" },
    { key: "success_page", label: "Success Page" },
    { key: "submissions", label: `Submissions (${submissions.length})` },
  ];

  async function handleSave() {
    setSaving(true);
    await saveFormVersion(formId, {
      schema,
      page_data: pageData as Record<string, unknown> | null,
      success_page_data: successPageData as Record<string, unknown> | null,
      settings,
    });
    setSaving(false);
  }

  async function handlePublish() {
    await publishForm(formId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-brand-primary text-white"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Version
          </Button>
          {formStatus !== "published" && (
            <Button onClick={handlePublish}>Publish</Button>
          )}
        </div>
      </div>

      {activeTab === "fields" && (
        <FieldBuilder
          schema={schema}
          onSchemaChange={setSchema}
          settings={settings}
          onSettingsChange={setSettings}
        />
      )}

      {activeTab === "landing_page" && (
        <div className="rounded-lg border overflow-hidden" style={{ minHeight: "60vh" }}>
          <PuckEditor
            initialData={pageData || { content: [], root: { props: {} } }}
            onSave={(data) => setPageData(data)}
          />
        </div>
      )}

      {activeTab === "success_page" && (
        <div className="rounded-lg border overflow-hidden" style={{ minHeight: "60vh" }}>
          <PuckEditor
            initialData={successPageData || { content: [], root: { props: {} } }}
            onSave={(data) => setSuccessPageData(data)}
          />
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="border-b">
                    <td className="px-4 py-3 text-sm">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <pre className="max-w-lg truncate text-xs">
                        {JSON.stringify(sub.data, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
