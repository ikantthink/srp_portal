"use server";

import { generateText } from "ai";
import { gateway } from "@/lib/ai/gateway";
import { componentNames } from "../config";

export async function generatePageData(prompt: string) {
  const componentList = componentNames.join(", ");

  const { text } = await generateText({
    model: gateway("openai/gpt-4o"),
    system: `You are a page builder assistant. You generate JSON data payloads for a visual page editor.

Available components: ${componentList}

Component prop schemas:
- Hero: heading (string), subheading (string), ctaText (string), ctaLink (string), backgroundImage (string), overlay (boolean)
- TextBlock: content (string), alignment ("left"|"center"|"right")
- ImageGallery: images (string, newline-separated URLs), columns (number)
- VideoEmbed: url (string), aspectRatio ("16:9"|"4:3"|"1:1")
- Testimonials: items (string, format: "Name|Quote|Rating" per line)
- CallToAction: heading (string), description (string), buttonText (string), buttonLink (string), variant ("primary"|"secondary"|"accent")
- ContactInfo: address (string), phone (string), email (string), showMap (boolean)
- Stats: items (string, format: "Value|Label" per line)
- FAQ: items (string, format: "Question|Answer" per line)
- Spacer: height (number)
- Divider: width ("full"|"medium"|"small")
- FormEmbed: formSlug (string), heading (string)
- NewsletterSubscribe: heading (string), description (string), buttonText (string)

Return ONLY valid JSON in this exact format:
{
  "content": [
    { "type": "ComponentName", "props": { "id": "unique-id", ...componentProps } }
  ],
  "root": { "props": {} }
}

Each content item must have a unique "id" in props (use format "ComponentName-1", "ComponentName-2", etc).`,
    prompt: `Generate a page layout for: ${prompt}`,
  });

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { data: JSON.parse(jsonMatch[0]) };
    }
    return { error: "Failed to parse AI response" };
  } catch {
    return { error: "Failed to parse AI response" };
  }
}
