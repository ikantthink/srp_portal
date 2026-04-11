-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_card_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idx_listings_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

-- Profiles: everyone can read, users can update own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (user_id = auth.uid());

-- User roles: only super_admin can manage, users can read own
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR public.get_user_role() = 'super_admin');
CREATE POLICY "roles_manage_super" ON public.user_roles FOR ALL USING (public.get_user_role() = 'super_admin');

-- Transactions: all authenticated users can CRUD (team-wide)
CREATE POLICY "transactions_all" ON public.transactions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "milestones_all" ON public.transaction_milestones FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "parties_all" ON public.transaction_parties FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "documents_all" ON public.transaction_documents FOR ALL USING (auth.uid() IS NOT NULL);

-- Leads: all authenticated users
CREATE POLICY "leads_all" ON public.leads FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "lead_activities_all" ON public.lead_activities FOR ALL USING (auth.uid() IS NOT NULL);

-- Link cards: owner can manage, public can read (for /c/[slug])
CREATE POLICY "link_cards_select" ON public.link_cards FOR SELECT USING (true);
CREATE POLICY "link_cards_manage_own" ON public.link_cards FOR ALL USING (
  agent_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR public.get_user_role() IN ('admin', 'super_admin')
);
CREATE POLICY "link_card_versions_select" ON public.link_card_versions FOR SELECT USING (true);
CREATE POLICY "link_card_versions_manage" ON public.link_card_versions FOR ALL USING (auth.uid() IS NOT NULL);

-- Forms: authenticated users can manage, public can read published
CREATE POLICY "forms_select" ON public.forms FOR SELECT USING (true);
CREATE POLICY "forms_manage" ON public.forms FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "form_versions_select" ON public.form_versions FOR SELECT USING (true);
CREATE POLICY "form_versions_manage" ON public.form_versions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "form_submissions_select" ON public.form_submissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "form_submissions_insert" ON public.form_submissions FOR INSERT WITH CHECK (true);

-- Newsletters: admin+ only
CREATE POLICY "newsletter_templates_select" ON public.newsletter_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "newsletter_templates_manage" ON public.newsletter_templates FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));
CREATE POLICY "newsletters_select" ON public.newsletters FOR SELECT USING (public.get_user_role() IN ('admin', 'super_admin'));
CREATE POLICY "newsletters_manage" ON public.newsletters FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));
CREATE POLICY "subscribers_select" ON public.newsletter_subscribers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "subscribers_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "subscribers_manage" ON public.newsletter_subscribers FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));

-- Website: public read, admin+ manage
CREATE POLICY "pages_select" ON public.website_pages FOR SELECT USING (true);
CREATE POLICY "pages_manage" ON public.website_pages FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));
CREATE POLICY "settings_select" ON public.website_settings FOR SELECT USING (true);
CREATE POLICY "settings_manage" ON public.website_settings FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));
CREATE POLICY "idx_cache_select" ON public.idx_listings_cache FOR SELECT USING (true);
CREATE POLICY "idx_cache_manage" ON public.idx_listings_cache FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));

-- Notification settings: own only
CREATE POLICY "notif_settings_own" ON public.notification_settings FOR ALL USING (user_id = auth.uid());

-- Email/SMS templates: admin+ manage
CREATE POLICY "email_templates_select" ON public.email_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "email_templates_manage" ON public.email_templates FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));
CREATE POLICY "sms_templates_select" ON public.sms_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sms_templates_manage" ON public.sms_templates FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));

-- API config: super_admin only
CREATE POLICY "api_config_manage" ON public.api_configurations FOR ALL USING (public.get_user_role() = 'super_admin');

-- Brand settings: public read, super_admin manage
CREATE POLICY "brand_select" ON public.brand_settings FOR SELECT USING (true);
CREATE POLICY "brand_manage" ON public.brand_settings FOR ALL USING (public.get_user_role() = 'super_admin');
