export function sanitizeInput(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeInput);
  }
  if (value && typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      clean[sanitizeInput(k) as string] = sanitizeInput(v);
    }
    return clean;
  }
  return value;
}
