/** Accept only same-origin relative paths; reject protocol-relative and backslash tricks. */
export function safeRedirectPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/portal";
  }
  return next;
}
