-- Invite-only account creation: an `invites` table plus a trigger that blocks
-- any new auth.users row (password signup, magic link, Google OAuth, or the
-- Admin API) unless a matching pending invite exists. This enforces
-- invite-only signup at the database level so it can't be bypassed by any
-- client-side auth call, including "Continue with Google".

CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now() NOT NULL,
  accepted_at timestamptz
);

CREATE INDEX invites_email_idx ON public.invites (lower(email));
CREATE UNIQUE INDEX invites_email_pending_idx ON public.invites (lower(email)) WHERE status = 'pending';

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select" ON public.invites FOR SELECT USING (
  public.get_user_role() IN ('admin', 'super_admin')
);

CREATE POLICY "invites_insert" ON public.invites FOR INSERT WITH CHECK (
  public.get_user_role() IN ('admin', 'super_admin')
  AND (role <> 'super_admin' OR public.get_user_role() = 'super_admin')
);

CREATE POLICY "invites_update" ON public.invites FOR UPDATE USING (
  public.get_user_role() = 'super_admin'
  OR (public.get_user_role() = 'admin' AND invited_by = auth.uid())
);

CREATE POLICY "invites_delete" ON public.invites FOR DELETE USING (
  public.get_user_role() = 'super_admin'
  OR (public.get_user_role() = 'admin' AND invited_by = auth.uid())
);

-- Checked by the enforce_invite_only trigger below and by the accept-invite
-- server action before creating the auth user.
CREATE OR REPLACE FUNCTION public.is_email_invited(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invites
    WHERE lower(email) = lower(p_email)
      AND status = 'pending'
      AND expires_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_invite_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_email_invited(NEW.email) THEN
    RAISE EXCEPTION 'invite_required: % has no pending invite', NEW.email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_invite_check
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_invite_only();
