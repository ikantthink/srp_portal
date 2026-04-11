import { describe, it, expect } from "vitest";
import { sanitizeInput } from "@/lib/forms/sanitize";

describe("sanitizeInput", () => {
  it("escapes HTML angle brackets in strings", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
    );
  });

  it("escapes double quotes", () => {
    expect(sanitizeInput('He said "hello"')).toBe(
      "He said &quot;hello&quot;"
    );
  });

  it("escapes single quotes", () => {
    expect(sanitizeInput("it's")).toBe("it&#x27;s");
  });

  it("escapes forward slashes", () => {
    expect(sanitizeInput("a/b")).toBe("a&#x2F;b");
  });

  it("leaves plain text unchanged (no special chars)", () => {
    expect(sanitizeInput("Hello World 123")).toBe("Hello World 123");
  });

  it("passes through numbers unchanged", () => {
    expect(sanitizeInput(42)).toBe(42);
  });

  it("passes through booleans unchanged", () => {
    expect(sanitizeInput(true)).toBe(true);
    expect(sanitizeInput(false)).toBe(false);
  });

  it("passes through null and undefined", () => {
    expect(sanitizeInput(null)).toBe(null);
    expect(sanitizeInput(undefined)).toBe(undefined);
  });

  it("sanitizes all elements in an array", () => {
    const input = ["<b>bold</b>", "safe", 5];
    const result = sanitizeInput(input);
    expect(result).toEqual(["&lt;b&gt;bold&lt;&#x2F;b&gt;", "safe", 5]);
  });

  it("sanitizes both keys and values of objects", () => {
    const input = { "<key>": "value with <html>" };
    const result = sanitizeInput(input);
    expect(result).toEqual({
      "&lt;key&gt;": "value with &lt;html&gt;",
    });
  });

  it("recursively sanitizes nested structures", () => {
    const input = {
      name: "John",
      data: {
        comment: "<img onerror=alert(1)>",
        tags: ["<b>", "safe"],
      },
    };
    const result = sanitizeInput(input) as Record<string, unknown>;
    const data = result.data as Record<string, unknown>;
    expect(data.comment).toBe("&lt;img onerror=alert(1)&gt;");
    expect(data.tags).toEqual(["&lt;b&gt;", "safe"]);
  });

  it("handles empty string", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("handles empty object", () => {
    expect(sanitizeInput({})).toEqual({});
  });

  it("handles empty array", () => {
    expect(sanitizeInput([])).toEqual([]);
  });
});
