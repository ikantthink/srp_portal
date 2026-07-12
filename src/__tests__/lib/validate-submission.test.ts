import { describe, it, expect } from "vitest";
import {
  isPublishedFormVersion,
  validateSubmissionPayload,
} from "@/lib/forms/validate-submission";

describe("isPublishedFormVersion", () => {
  it("accepts matching published version", () => {
    expect(
      isPublishedFormVersion(
        { status: "published", published_version_id: "v1" },
        "v1"
      )
    ).toBe(true);
  });

  it("rejects draft forms", () => {
    expect(
      isPublishedFormVersion(
        { status: "draft", published_version_id: "v1" },
        "v1"
      )
    ).toBe(false);
  });

  it("rejects wrong version id", () => {
    expect(
      isPublishedFormVersion(
        { status: "published", published_version_id: "v1" },
        "v2"
      )
    ).toBe(false);
  });
});

describe("validateSubmissionPayload", () => {
  it("validates required fields against schema", () => {
    const result = validateSubmissionPayload(
      { name: "Jane" },
      { fields: [{ id: "name", type: "text", label: "Name", required: true }] }
    );
    expect(result).toEqual({ ok: true, data: { name: "Jane" } });
  });

  it("rejects missing required fields", () => {
    const result = validateSubmissionPayload(
      {},
      { fields: [{ id: "name", type: "text", label: "Name", required: true }] }
    );
    expect("error" in result).toBe(true);
  });
});
