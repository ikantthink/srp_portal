"use server";

import { generateText } from "ai";
import { gateway } from "@/lib/ai/gateway";
import { isIntegrationEnabled } from "@/lib/integrations/status";
import { requireAdmin } from "@/lib/supabase/require-auth";

export async function generateNewsletterDraft(prompt: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  if (!(await isIntegrationEnabled("ai"))) {
    return { error: "AI is currently disabled." };
  }

  const { text } = await generateText({
    model: gateway("openai/gpt-4o"),
    system: `You are a real estate newsletter writer. Write engaging, professional newsletter content.
Output JSON with this format:
{
  "subject": "Newsletter subject line",
  "blocks": [
    { "type": "heading", "content": "Section heading" },
    { "type": "paragraph", "content": "Paragraph text..." },
    { "type": "cta", "text": "Button text", "url": "/contact" }
  ]
}`,
    prompt,
  });

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return { data: JSON.parse(jsonMatch[0]) };
    return { error: "Failed to parse AI response" };
  } catch {
    return { error: "Failed to parse AI response" };
  }
}
