"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldBuilder } from "./field-builder";
import { FormSettings } from "./form-settings";
import { SubmissionsTable } from "./submissions-table";
import { VersionHistory } from "./version-history";
import { PuckEditor } from "@/lib/puck/editor-wrapper";
import {
  saveFormVersion,
  publishForm,
  publishSpecificVersion,
  loadVersionIntoDraft,
} from "@/actions/forms";
import type { FormVersion, FormSubmission } from "@/types/database";
import type { Data } from "@puckeditor/core";
import { Loader2 } from "lucide-react";

type Tab = "fields" | "settings" | "landing_page" | "success_page" | "versions" | "submissions";

interface FormBuilderTabsProps {
  formId: string;
  formSlug: string;
  formStatus: string;
  version: FormVersion | null;
  allVersions: FormVersion[];
  publishedVersionId: string | null;
  submissions: FormSubmission[];
  initialTab?: string;
}

const validTabs: Tab[] = ["fields", "settings", "landing_page", "success_page", "versions", "submissions"];

export function FormBuilderTabs({
  formId,
  formSlug,
  formStatus,
  version,
  allVersions,
  publishedVersionId,
  submissions,
  initialTab,
}: FormBuilderTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab && validTabs.includes(initialTab as Tab) ? (initialTab as Tab) : "fields"
  );
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
    version?.settings || {
      success_message: "Thank you for your submission!",
      enable_landing_page: false,
      enable_custom_success_page: false,
      notify_on_submission: true,
      notification_cc_emails: [],
    }
  );
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const enableLandingPage = (settings.enable_landing_page as boolean) || false;
  const enableCustomSuccessPage = (settings.enable_custom_success_page as boolean) || false;

  const hasUnpublishedChanges =
    formStatus === "published" && version?.id !== publishedVersionId;

  const tabs: { key: Tab; label: string }[] = [
    { key: "fields", label: "Fields" },
    { key: "settings", label: "Settings" },
    ...(enableLandingPage ? [{ key: "landing_page" as Tab, label: "Landing Page" }] : []),
    ...(enableCustomSuccessPage ? [{ key: "success_page" as Tab, label: "Success Page" }] : []),
    { key: "versions", label: `Versions (${allVersions.length})` },
    { key: "submissions", label: `Submissions (${submissions.length})` },
  ];

  function handleSettingsChange(newSettings: Record<string, unknown>) {
    const wasSuccessPageEnabled = (settings.enable_custom_success_page as boolean) || false;
    const isSuccessPageEnabled = (newSettings.enable_custom_success_page as boolean) || false;

    if (!wasSuccessPageEnabled && isSuccessPageEnabled && !successPageData) {
      const message = (newSettings.success_message as string) || "Thank you for your submission!";
      setSuccessPageData({
        content: [
          {
            type: "TextBlock",
            props: {
              id: "success-text",
              content: message,
              alignment: "center" as const,
            },
          },
        ],
        root: { props: {} },
      } as Data);
    }

    setSettings(newSettings);

    if (!(newSettings.enable_landing_page as boolean) && activeTab === "landing_page") {
      setActiveTab("settings");
    }
    if (!(newSettings.enable_custom_success_page as boolean) && activeTab === "success_page") {
      setActiveTab("settings");
    }
  }

  async function handleSave() {
    setSaving(true);
    await saveFormVersion(formId, {
      schema,
      page_data: enableLandingPage ? (pageData as Record<string, unknown> | null) : null,
      success_page_data: enableCustomSuccessPage ? (successPageData as Record<string, unknown> | null) : null,
      settings,
    });
    setSaving(false);
    startTransition(() => router.refresh());
  }

  async function handlePublish() {
    setPublishing(true);
    await handleSave();
    await publishForm(formId);
    setPublishing(false);
    startTransition(() => router.refresh());
  }

  async function handlePublishVersion(versionId: string) {
    setPublishing(true);
    await publishSpecificVersion(formId, versionId);
    setPublishing(false);
    startTransition(() => router.refresh());
  }

  async function handleLoadVersion(versionId: string) {
    await loadVersionIntoDraft(formId, versionId);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border p-1 flex-wrap">
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
        <div className="flex items-center gap-2">
          {hasUnpublishedChanges && (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              Unpublished Changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleSave} disabled={saving || publishing}>
            {saving && !publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Draft
          </Button>
          <Button onClick={handlePublish} disabled={saving || publishing}>
            {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {formStatus === "published" ? "Save & Publish" : "Publish"}
          </Button>
        </div>
      </div>

      {activeTab === "fields" && (
        <FieldBuilder
          schema={schema}
          onSchemaChange={setSchema}
        />
      )}

      {activeTab === "settings" && (
        <FormSettings
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {activeTab === "landing_page" && (
        <div className="rounded-lg border overflow-hidden" style={{ minHeight: "60vh" }}>
          <PuckEditor
            initialData={pageData || { content: [], root: { props: {} } }}
            onChange={(data) => setPageData(data)}
            onSave={(data) => setPageData(data)}
            formSlug={formSlug}
          />
        </div>
      )}

      {activeTab === "success_page" && (
        <div className="rounded-lg border overflow-hidden" style={{ minHeight: "60vh" }}>
          <PuckEditor
            initialData={successPageData || { content: [], root: { props: {} } }}
            onChange={(data) => setSuccessPageData(data)}
            onSave={(data) => setSuccessPageData(data)}
          />
        </div>
      )}

      {activeTab === "versions" && (
        <VersionHistory
          versions={allVersions}
          currentVersionId={version?.id || null}
          publishedVersionId={publishedVersionId}
          onPublishVersion={handlePublishVersion}
          onLoadVersion={handleLoadVersion}
          isLoading={publishing || isPending}
        />
      )}

      {activeTab === "submissions" && (
        <SubmissionsTable
          submissions={submissions}
          allVersions={allVersions}
        />
      )}
    </div>
  );
}
