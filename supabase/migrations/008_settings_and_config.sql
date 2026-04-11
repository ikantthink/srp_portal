CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms')),
  event_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, channel, event_type)
);

CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('form_response', 'lead_notification', 'transaction_update', 'newsletter')),
  subject text NOT NULL,
  body_html text NOT NULL DEFAULT '',
  body_react_component text,
  variables jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  body text NOT NULL DEFAULT '',
  variables jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER sms_templates_updated_at
  BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.api_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL CHECK (service IN ('twilio', 'resend', 'idx_broker', 'reso', 'openai', 'google_oauth')),
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(service)
);

CREATE TRIGGER api_configurations_updated_at
  BEFORE UPDATE ON public.api_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  primary_color text NOT NULL DEFAULT '#1e40af',
  secondary_color text NOT NULL DEFAULT '#7c3aed',
  accent_color text NOT NULL DEFAULT '#f59e0b',
  font_heading text NOT NULL DEFAULT 'Geist',
  font_body text NOT NULL DEFAULT 'Geist',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER brand_settings_updated_at
  BEFORE UPDATE ON public.brand_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed default brand settings row
INSERT INTO public.brand_settings (id) VALUES (gen_random_uuid());
