"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createNewsletter, updateNewsletter, sendNewsletter } from "@/actions/newsletters";
import { generateNewsletterDraft } from "@/lib/ai/newsletter";
import { Loader2, Sparkles, Send } from "lucide-react";
import type { Newsletter } from "@/types/database";

export function NewsletterComposer({ newsletter }: { newsletter: Newsletter | null }) {
  const [subject, setSubject] = useState(newsletter?.subject || "");
  const [body, setBody] = useState(
    newsletter?.body_json
      ? JSON.stringify(newsletter.body_json, null, 2)
      : ""
  );
  const [aiPrompt, setAiPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSave() {
    setLoading(true);
    if (newsletter) {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch { parsed = { text: body }; }
      await updateNewsletter(newsletter.id, { subject, body_json: parsed });
    } else {
      const formData = new FormData();
      formData.set("subject", subject);
      await createNewsletter(formData);
    }
    setLoading(false);
  }

  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    const result = await generateNewsletterDraft(aiPrompt);
    if (result.data) {
      if (result.data.subject) setSubject(result.data.subject);
      setBody(JSON.stringify(result.data, null, 2));
    }
    setAiLoading(false);
  }

  async function handleSend() {
    if (!newsletter) return;
    setSending(true);
    await sendNewsletter(newsletter.id);
    setSending(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Compose</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nl-subject">Subject</Label>
              <Input
                id="nl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Newsletter subject line"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl-body">Body (JSON)</Label>
              <Textarea
                id="nl-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder='{"blocks": [{"type": "heading", "content": "Hello!"}]}'
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {newsletter ? "Save" : "Create Draft"}
              </Button>
              {newsletter && newsletter.status === "draft" && (
                <Button variant="default" onClick={handleSend} disabled={sending}>
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-accent" />
              AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the newsletter you want to write, e.g. 'Monthly market update for April with spring buying tips'"
              className="min-h-[100px]"
            />
            <Button
              onClick={handleAIGenerate}
              disabled={aiLoading}
              className="w-full"
              variant="secondary"
            >
              {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Draft
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
