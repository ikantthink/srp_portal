CREATE TYPE public.lead_source AS ENUM ('website_form', 'link_card', 'manual', 'referral', 'idx');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'nurturing', 'closed_won', 'closed_lost');
CREATE TYPE public.lead_type AS ENUM ('buying', 'selling', 'both');

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  source public.lead_source NOT NULL DEFAULT 'manual',
  status public.lead_status NOT NULL DEFAULT 'new',
  type public.lead_type NOT NULL DEFAULT 'buying',
  timeline text,
  budget_min numeric,
  budget_max numeric,
  preferred_areas text,
  assigned_agent_id uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL
);
