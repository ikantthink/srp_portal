-- 035 revoked EXECUTE from PUBLIC, but Supabase also grants EXECUTE to
-- anon/authenticated explicitly (not just via PUBLIC) on public schema
-- functions, so the prior revoke didn't actually block RPC access. Revoke
-- from those roles too to prevent email-enumeration via
-- /rest/v1/rpc/is_email_invited.
REVOKE EXECUTE ON FUNCTION public.is_email_invited(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_invite_only() FROM anon, authenticated;
