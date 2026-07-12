import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("allows normal relative paths", () => {
    expect(safeRedirectPath("/portal/leads")).toBe("/portal/leads");
  });

  it("rejects protocol-relative paths", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/portal");
  });

  it("rejects backslash tricks", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe("/portal");
  });

  it("falls back when next is null", () => {
    expect(safeRedirectPath(null)).toBe("/portal");
  });
});
