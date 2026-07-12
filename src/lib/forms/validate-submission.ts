import { schemaToZod } from "./schema-to-zod";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

export function isPublishedFormVersion(
  form: { status: string; published_version_id: string | null },
  versionId: string
): boolean {
  return form.status === "published" && form.published_version_id === versionId;
}

export function validateSubmissionPayload(
  data: Record<string, unknown>,
  schema: { fields?: FormField[] }
): { ok: true; data: Record<string, unknown> } | { error: string } {
  const fields = (schema.fields || []) as FormField[];
  const zodSchema = schemaToZod(fields);
  const result = zodSchema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues[0]?.message || "Invalid submission";
    return { error: msg };
  }
  return { ok: true, data: result.data as Record<string, unknown> };
}
