export type Role = "super_admin" | "admin" | "user";

export type TransactionType = "purchase" | "sale" | "lease";
export type TransactionStatus = "active" | "pending" | "closed" | "cancelled";
export type MilestoneType =
  | "listing"
  | "offer_received"
  | "offer_accepted"
  | "inspection"
  | "appraisal"
  | "title_search"
  | "financing"
  | "final_walkthrough"
  | "closing";
export type MilestoneStatus = "pending" | "in_progress" | "completed" | "skipped";
export type PartyRole =
  | "buyer"
  | "seller"
  | "lender"
  | "title_company"
  | "inspector"
  | "appraiser"
  | "attorney";

export type LeadSource = "website_form" | "link_card" | "manual" | "referral" | "idx";
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "nurturing"
  | "closed_won"
  | "closed_lost";
export type LeadType = "buying" | "selling" | "both";

export type FormStatus = "draft" | "published" | "archived";
export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "multi_select"
  | "radio"
  | "checkbox"
  | "date"
  | "number"
  | "file_upload"
  | "address"
  | "heading"
  | "paragraph";

export type NewsletterStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type SubscriberStatus = "active" | "unsubscribed" | "bounced";

export type LinkCardWidgetType =
  | "social_link"
  | "form_link"
  | "button_link"
  | "image"
  | "video_embed"
  | "text_block"
  | "contact_info"
  | "map_embed"
  | "calendar_link"
  | "newsletter_subscribe"
  | "widget_group";

export interface LinkCardLayout {
  show_header: boolean;
  show_name: boolean;
  show_bio: boolean;
  show_avatar: boolean;
  header_bg_type: "gradient" | "image";
  header_gradient_from: string;
  header_gradient_to: string;
  header_bg_image: string;
  header_text_color: string;
  avatar_size: "sm" | "md" | "lg" | "xl";
  page_bg_color: string;
  card_bg_color: string;
  body_text_color: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

export interface Transaction {
  id: string;
  property_address: string;
  type: TransactionType;
  status: TransactionStatus;
  list_price: number | null;
  sale_price: number | null;
  listing_date: string | null;
  closing_date: string | null;
  assigned_agent_id: string | null;
  buyer_agent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionMilestone {
  id: string;
  transaction_id: string;
  milestone: MilestoneType;
  status: MilestoneStatus;
  due_date: string | null;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionParty {
  id: string;
  transaction_id: string;
  role: PartyRole;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
}

export interface TransactionDocument {
  id: string;
  transaction_id: string;
  name: string;
  file_path: string;
  type: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  type: LeadType;
  workflow_stage_id: string | null;
  timeline: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_areas: string | null;
  assigned_agent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations (optional)
  tags?: LeadTag[];
  workflow_stage?: WorkflowStage | null;
}

export interface LeadTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  entity_type: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStage {
  id: string;
  workflow_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface LinkCard {
  id: string;
  agent_id: string;
  slug: string;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkCardVersion {
  id: string;
  link_card_id: string;
  version_number: number;
  layout: Record<string, unknown>;
  widgets: Record<string, unknown>[];
  published_at: string | null;
  created_by: string;
  created_at: string;
}

export interface Form {
  id: string;
  name: string;
  slug: string;
  status: FormStatus;
  current_version_id: string | null;
  published_version_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FormVersion {
  id: string;
  form_id: string;
  version_number: number;
  schema: Record<string, unknown>;
  page_data: Record<string, unknown> | null;
  success_page_data: Record<string, unknown> | null;
  settings: Record<string, unknown>;
  status: string;
  published_at: string | null;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  version_id: string;
  data: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  submitted_at: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  description: string | null;
  react_component_name: string;
  thumbnail_url: string | null;
  created_at: string;
}

export interface Newsletter {
  id: string;
  subject: string;
  body_json: Record<string, unknown>;
  template_id: string | null;
  status: NewsletterStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  resend_batch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  status: SubscriberStatus;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface WebsitePage {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  puck_data: Record<string, unknown>;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShortUrl {
  id: string;
  code: string;
  target_url: string;
  title: string | null;
  click_count: number;
  created_by: string;
  link_card_id: string | null;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  short_domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandSettings {
  id: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_bg: string | null;
  sidebar_fg: string | null;
  sidebar_muted: string | null;
  font_heading: string;
  font_body: string;
  created_at: string;
  updated_at: string;
}
