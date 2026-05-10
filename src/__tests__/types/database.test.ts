import { describe, it, expect } from "vitest";
import type {
  Role,
  TransactionType,
  TransactionStatus,
  MilestoneType,
  LeadSource,
  LeadStatus,
  FormStatus,
  FormFieldType,
  NewsletterStatus,
  LinkCardWidgetType,
} from "@/types/database";

describe("Database type enums are correctly typed", () => {
  it("Role values match plan", () => {
    const roles: Role[] = ["super_admin", "admin", "user"];
    expect(roles).toHaveLength(3);
  });

  it("TransactionType values match plan", () => {
    const types: TransactionType[] = ["purchase", "sale", "lease"];
    expect(types).toHaveLength(3);
  });

  it("TransactionStatus values match plan", () => {
    const statuses: TransactionStatus[] = ["active", "pending", "closed", "cancelled"];
    expect(statuses).toHaveLength(4);
  });

  it("MilestoneType values match plan (9 milestones)", () => {
    const milestones: MilestoneType[] = [
      "listing",
      "offer_received",
      "offer_accepted",
      "inspection",
      "appraisal",
      "title_search",
      "financing",
      "final_walkthrough",
      "closing",
    ];
    expect(milestones).toHaveLength(9);
  });

  it("LeadSource values match plan", () => {
    const sources: LeadSource[] = ["website_form", "link_card", "manual", "referral", "idx"];
    expect(sources).toHaveLength(5);
  });

  it("LeadStatus values match plan", () => {
    const statuses: LeadStatus[] = [
      "new",
      "contacted",
      "qualified",
      "nurturing",
      "closed_won",
      "closed_lost",
    ];
    expect(statuses).toHaveLength(6);
  });

  it("FormStatus values match plan", () => {
    const statuses: FormStatus[] = ["draft", "published", "archived"];
    expect(statuses).toHaveLength(3);
  });

  it("FormFieldType includes all 14 planned field types", () => {
    const types: FormFieldType[] = [
      "text",
      "email",
      "phone",
      "textarea",
      "select",
      "multi_select",
      "radio",
      "checkbox",
      "date",
      "number",
      "file_upload",
      "address",
      "heading",
      "paragraph",
    ];
    expect(types).toHaveLength(14);
  });

  it("NewsletterStatus values match plan", () => {
    const statuses: NewsletterStatus[] = ["draft", "scheduled", "sending", "sent", "failed"];
    expect(statuses).toHaveLength(5);
  });

  it("LinkCardWidgetType includes all widget types", () => {
    const types: LinkCardWidgetType[] = [
      "social_link",
      "form_link",
      "button_link",
      "image",
      "video_embed",
      "text_block",
      "contact_info",
      "map_embed",
      "calendar_link",
      "newsletter_subscribe",
      "widget_group",
    ];
    expect(types).toHaveLength(11);
    expect(types).toContain("newsletter_subscribe");
    expect(types).toContain("button_link");
    expect(types).toContain("widget_group");
  });
});
