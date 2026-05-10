"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import type { LeadTag } from "@/types/database";

interface FormSettingsProps {
  settings: Record<string, unknown>;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

export function FormSettings({ settings, onSettingsChange }: FormSettingsProps) {
  const [ccInput, setCcInput] = useState("");
  const [leadTags, setLeadTags] = useState<LeadTag[]>([]);

  useEffect(() => {
    fetch("/api/lead-tags")
      .then((r) => r.json())
      .then((data) => setLeadTags(data))
      .catch(() => {});
  }, []);

  const successMessage = (settings.success_message as string) || "Thank you for your submission!";
  const enableLandingPage = (settings.enable_landing_page as boolean) || false;
  const enableCustomSuccessPage = (settings.enable_custom_success_page as boolean) || false;
  const notifyOnSubmission = settings.notify_on_submission !== false;
  const ccEmails = (settings.notification_cc_emails as string[]) || [];
  const captureAsLead = (settings.capture_as_lead as boolean) || false;
  const selectedTagIds = (settings.lead_capture_tag_ids as string[]) || [];

  function update(patch: Record<string, unknown>) {
    onSettingsChange({ ...settings, ...patch });
  }

  function addCcEmail() {
    const email = ccInput.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (ccEmails.includes(email)) return;
    update({ notification_cc_emails: [...ccEmails, email] });
    setCcInput("");
  }

  function removeCcEmail(email: string) {
    update({ notification_cc_emails: ccEmails.filter((e) => e !== email) });
  }

  function handleCcKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCcEmail();
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Response</h3>
          <p className="text-sm text-muted-foreground">
            The message shown to users after they submit the form.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="success-message">Success Message</Label>
          <Textarea
            id="success-message"
            value={successMessage}
            onChange={(e) => update({ success_message: e.target.value })}
            rows={3}
          />
        </div>
      </section>

      <hr />

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Email Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Receive an email when someone submits this form.
          </p>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Send notification on submission</p>
            <p className="text-xs text-muted-foreground">
              The form author will receive an email with the submission data.
            </p>
          </div>
          <Switch
            checked={notifyOnSubmission}
            onCheckedChange={(checked) => update({ notify_on_submission: checked })}
          />
        </div>

        {notifyOnSubmission && (
          <div className="space-y-2">
            <Label>CC Email Addresses</Label>
            <p className="text-xs text-muted-foreground">
              Additional email addresses that will receive submission notifications.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyDown={handleCcKeyDown}
                onBlur={addCcEmail}
                placeholder="email@example.com"
                className="flex-1"
              />
              <button
                type="button"
                onClick={addCcEmail}
                className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Add
              </button>
            </div>
            {ccEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {ccEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
                  >
                    {email}
                    <button
                      onClick={() => removeCcEmail(email)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <hr />

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Lead Capture</h3>
          <p className="text-sm text-muted-foreground">
            Automatically create a lead in your CRM when someone submits this form.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Create lead on submission</p>
            <p className="text-xs text-muted-foreground">
              New submissions will be added to your leads pipeline.
            </p>
          </div>
          <Switch
            checked={captureAsLead}
            onCheckedChange={(checked) => update({ capture_as_lead: checked })}
          />
        </div>

        {captureAsLead && (
          <div className="space-y-2">
            <Label>Lead Tags</Label>
            <p className="text-xs text-muted-foreground">
              Tags that will be applied to leads created from this form.
            </p>
            {leadTags.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No tags available. Create tags in the Leads settings.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {leadTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? selectedTagIds.filter((id) => id !== tag.id)
                          : [...selectedTagIds, tag.id];
                        update({ lead_capture_tag_ids: next });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors"
                      style={{
                        backgroundColor: selected ? tag.color : "transparent",
                        color: selected ? "white" : undefined,
                        borderColor: tag.color,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: selected ? "white" : tag.color }}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <hr />

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Custom Pages</h3>
          <p className="text-sm text-muted-foreground">
            Optionally wrap your form with custom landing and success pages built with the page editor.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Custom Landing Page</p>
            <p className="text-xs text-muted-foreground">
              Show a full landing page with the form embedded, instead of just the bare form.
            </p>
          </div>
          <Switch
            checked={enableLandingPage}
            onCheckedChange={(checked) => update({ enable_landing_page: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Custom Success Page</p>
            <p className="text-xs text-muted-foreground">
              Show a custom page after submission instead of just the success message.
            </p>
          </div>
          <Switch
            checked={enableCustomSuccessPage}
            onCheckedChange={(checked) => update({ enable_custom_success_page: checked })}
          />
        </div>
      </section>
    </div>
  );
}
