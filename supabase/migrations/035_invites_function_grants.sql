-- is_email_invited/enforce_invite_only are only meant to be called internally
-- by the BEFORE INSERT trigger on auth.users, not exposed as public RPC
-- endpoints.
REVOKE EXECUTE ON FUNCTION public.is_email_invited(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_invite_only() FROM PUBLIC;
