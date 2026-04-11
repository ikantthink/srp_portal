import { describe, it, expect } from "vitest";
import { schemaToZod } from "@/lib/forms/schema-to-zod";

describe("schemaToZod", () => {
  it("creates a valid schema from text fields", () => {
    const schema = schemaToZod([
      { id: "name", type: "text", label: "Name", required: true },
    ]);
    const result = schema.safeParse({ name: "John" });
    expect(result.success).toBe(true);
  });

  it("rejects empty required text field", () => {
    const schema = schemaToZod([
      { id: "name", type: "text", label: "Name", required: true },
    ]);
    const result = schema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("allows empty optional text field", () => {
    const schema = schemaToZod([
      { id: "name", type: "text", label: "Name", required: false },
    ]);
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("validates email fields", () => {
    const schema = schemaToZod([
      { id: "email", type: "email", label: "Email", required: true },
    ]);
    expect(schema.safeParse({ email: "valid@email.com" }).success).toBe(true);
    expect(schema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("validates phone fields with min length 7", () => {
    const schema = schemaToZod([
      { id: "phone", type: "phone", label: "Phone", required: true },
    ]);
    expect(schema.safeParse({ phone: "1234567" }).success).toBe(true);
    expect(schema.safeParse({ phone: "123" }).success).toBe(false);
  });

  it("coerces number fields", () => {
    const schema = schemaToZod([
      { id: "age", type: "number", label: "Age", required: false },
    ]);
    const result = schema.safeParse({ age: "25" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(25);
    }
  });

  it("validates date fields with YYYY-MM-DD format", () => {
    const schema = schemaToZod([
      { id: "dob", type: "date", label: "DOB", required: true },
    ]);
    expect(schema.safeParse({ dob: "2024-01-15" }).success).toBe(true);
    expect(schema.safeParse({ dob: "01/15/2024" }).success).toBe(false);
    expect(schema.safeParse({ dob: "not-a-date" }).success).toBe(false);
  });

  it("validates checkbox fields as boolean", () => {
    const schema = schemaToZod([
      { id: "agree", type: "checkbox", label: "Agree", required: false },
    ]);
    const result = schema.safeParse({ agree: true });
    expect(result.success).toBe(true);
  });

  it("validates multi_select fields as string arrays", () => {
    const schema = schemaToZod([
      { id: "colors", type: "multi_select", label: "Colors", required: false },
    ]);
    expect(schema.safeParse({ colors: ["red", "blue"] }).success).toBe(true);
    expect(schema.safeParse({ colors: "red" }).success).toBe(false);
  });

  it("skips heading and paragraph fields", () => {
    const schema = schemaToZod([
      { id: "h1", type: "heading", label: "Section", required: false },
      { id: "p1", type: "paragraph", label: "Info text", required: false },
      { id: "name", type: "text", label: "Name", required: true },
    ]);
    const shape = schema.shape;
    expect(shape).not.toHaveProperty("h1");
    expect(shape).not.toHaveProperty("p1");
    expect(shape).toHaveProperty("name");
  });

  it("handles mixed required and optional fields", () => {
    const schema = schemaToZod([
      { id: "name", type: "text", label: "Name", required: true },
      { id: "bio", type: "textarea", label: "Bio", required: false },
      { id: "email", type: "email", label: "Email", required: true },
    ]);
    expect(schema.safeParse({ name: "Jane", email: "j@e.com" }).success).toBe(true);
    expect(schema.safeParse({ email: "j@e.com" }).success).toBe(false);
  });

  it("returns empty object schema for empty fields array", () => {
    const schema = schemaToZod([]);
    expect(schema.safeParse({}).success).toBe(true);
  });
});
