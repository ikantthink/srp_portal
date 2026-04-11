CREATE TYPE public.form_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status public.form_status NOT NULL DEFAULT 'draft',
  current_version_id uuid,
  created_by uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.form_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  schema jsonb NOT NULL DEFAULT '{"fields": []}',
  page_data jsonb,
  success_page_data jsonb,
  settings jsonb NOT NULL DEFAULT '{"success_behavior": "message", "success_message": "Thank you for your submission!"}',
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.forms
  ADD CONSTRAINT forms_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES public.form_versions(id);

CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  version_id uuid REFERENCES public.form_versions(id) NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  ip_address inet,
  user_agent text,
  submitted_at timestamptz DEFAULT now() NOT NULL
);
