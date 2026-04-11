import { createOpenAI } from "@ai-sdk/openai";

export const gateway = createOpenAI({
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY,
  baseURL: "https://ai-gateway.vercel.sh/v1",
});
