CREATE TABLE public.link_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  slug text UNIQUE NOT NULL,
  current_version_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER link_cards_updated_at
  BEFORE UPDATE ON public.link_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.link_card_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_card_id uuid REFERENCES public.link_cards(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  layout jsonb NOT NULL DEFAULT '{}',
  widgets jsonb NOT NULL DEFAULT '[]',
  published_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.link_cards
  ADD CONSTRAINT link_cards_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES public.link_card_versions(id);
