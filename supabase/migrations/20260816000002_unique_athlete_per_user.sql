-- Prevent duplicate athlete records for the same linked user account.
-- Client-side handleApprove is now check-before-insert, but this closes the
-- gap for concurrent approvals or any other insert path.
-- Date: 2026-08-16

CREATE UNIQUE INDEX IF NOT EXISTS atletas_usuario_id_unique
ON public.atletas (usuario_id)
WHERE usuario_id IS NOT NULL;
