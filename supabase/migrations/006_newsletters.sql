CREATE TYPE public.newsletter_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');
CREATE TYPE public.subscriber_status AS ENUM ('active', 'unsubscribed', 'bounced');

CREATE TABLE public.newsletter_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  react_component_name text NOT NULL,
  thumbnail_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body_json jsonb NOT NULL DEFAULT '{}',
  template_id uuid REFERENCES public.newsletter_templates(id),
  status public.newsletter_status NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  resend_batch_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER newsletters_updated_at
  BEFORE UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  status public.subscriber_status NOT NULL DEFAULT 'active',
  subscribed_at timestamptz DEFAULT now() NOT NULL,
  unsubscribed_at timestamptz
);
