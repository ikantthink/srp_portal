CREATE TABLE public.puck_block_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  component_type text NOT NULL,
  folder text NOT NULL DEFAULT 'Custom',
  props jsonb NOT NULL DEFAULT '{}',
  thumbnail_url text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER puck_block_presets_updated_at
  BEFORE UPDATE ON public.puck_block_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
