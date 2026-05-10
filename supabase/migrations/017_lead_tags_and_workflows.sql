-- Lead Tags
CREATE TABLE public.lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6b7280',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.lead_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES public.lead_tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (lead_id, tag_id)
);

CREATE INDEX idx_lead_tag_assignments_lead ON public.lead_tag_assignments(lead_id);
CREATE INDEX idx_lead_tag_assignments_tag ON public.lead_tag_assignments(tag_id);

-- Workflows (reusable for leads, transactions, etc.)
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entity_type text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (entity_type)
);

CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.workflow_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6b7280',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_workflow_stages_workflow ON public.workflow_stages(workflow_id, position);

-- Add workflow_stage_id to leads
ALTER TABLE public.leads ADD COLUMN workflow_stage_id uuid REFERENCES public.workflow_stages(id);

-- Seed default Lead workflow with stages matching existing enum values
DO $$
DECLARE
  wf_id uuid;
BEGIN
  INSERT INTO public.workflows (name, entity_type)
  VALUES ('Lead Pipeline', 'lead')
  RETURNING id INTO wf_id;

  INSERT INTO public.workflow_stages (workflow_id, name, color, position) VALUES
    (wf_id, 'New',        '#3b82f6', 0),
    (wf_id, 'Contacted',  '#8b5cf6', 1),
    (wf_id, 'Qualified',  '#f59e0b', 2),
    (wf_id, 'Nurturing',  '#06b6d4', 3),
    (wf_id, 'Closed Won', '#22c55e', 4),
    (wf_id, 'Closed Lost','#ef4444', 5);
END $$;

-- RLS
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_tags_select" ON public.lead_tags FOR SELECT USING (true);
CREATE POLICY "lead_tags_manage" ON public.lead_tags FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "lead_tag_assignments_select" ON public.lead_tag_assignments FOR SELECT USING (true);
CREATE POLICY "lead_tag_assignments_manage" ON public.lead_tag_assignments FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "workflows_select" ON public.workflows FOR SELECT USING (true);
CREATE POLICY "workflows_manage" ON public.workflows FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "workflow_stages_select" ON public.workflow_stages FOR SELECT USING (true);
CREATE POLICY "workflow_stages_manage" ON public.workflow_stages FOR ALL USING (auth.uid() IS NOT NULL);

-- Seed default tags
INSERT INTO public.lead_tags (name, color) VALUES
  ('Buyer',    '#3b82f6'),
  ('Seller',   '#22c55e'),
  ('Investor', '#f59e0b'),
  ('Referral', '#8b5cf6'),
  ('Hot',      '#ef4444');
