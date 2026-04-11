CREATE TYPE public.transaction_type AS ENUM ('purchase', 'sale', 'lease');
CREATE TYPE public.transaction_status AS ENUM ('active', 'pending', 'closed', 'cancelled');
CREATE TYPE public.milestone_type AS ENUM (
  'listing', 'offer_received', 'offer_accepted', 'inspection',
  'appraisal', 'title_search', 'financing', 'final_walkthrough', 'closing'
);
CREATE TYPE public.milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE public.party_role AS ENUM (
  'buyer', 'seller', 'lender', 'title_company', 'inspector', 'appraiser', 'attorney'
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_address text NOT NULL,
  type public.transaction_type NOT NULL DEFAULT 'purchase',
  status public.transaction_status NOT NULL DEFAULT 'active',
  list_price numeric,
  sale_price numeric,
  listing_date date,
  closing_date date,
  assigned_agent_id uuid REFERENCES public.profiles(id),
  buyer_agent_id uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.transaction_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  milestone public.milestone_type NOT NULL,
  status public.milestone_status NOT NULL DEFAULT 'pending',
  due_date date,
  completed_date date,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON public.transaction_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.transaction_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  role public.party_role NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.transaction_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  type text,
  uploaded_by uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
