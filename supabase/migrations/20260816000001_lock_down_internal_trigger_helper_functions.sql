-- These two functions are internal helpers for the privilege-escalation trigger only.
-- They were created with default PUBLIC execute grants, making them needlessly
-- callable via /rest/v1/rpc/... by anon/authenticated clients (flagged by advisors).
-- Date: 2026-08-16

REVOKE ALL ON FUNCTION public.is_bootstrap_admin_email(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_privilege_escalation() FROM PUBLIC, anon, authenticated;
