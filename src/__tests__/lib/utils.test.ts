import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
  it("merges simple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "active")).toBe("base active");
  });

  it("deduplicates conflicting Tailwind classes", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("handles undefined and null", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("merges arrays of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});
