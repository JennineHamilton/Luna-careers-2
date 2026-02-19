-- ============================================================
-- Luna Careers - Notifications scope: personal vs organization
-- Migration: 20260219000002
-- Description: Add scope and organization_id so org portal shows
--   only organization notifications; personal portal shows only
--   personal notifications.
-- ============================================================

-- Add columns
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20) NOT NULL DEFAULT 'personal'
    CHECK (scope IN ('personal', 'organization')),
  ADD COLUMN IF NOT EXISTS organization_id UUID NULL REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Backfill existing rows (all current notifications are personal)
UPDATE public.notifications
SET scope = 'personal', organization_id = NULL
WHERE scope IS NULL OR organization_id IS NOT NULL;

-- Index for filtering by user + scope + organization
CREATE INDEX IF NOT EXISTS idx_notifications_user_scope_org
  ON public.notifications(user_id, scope, organization_id);

-- Add new organization-related notification types to the constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'welcome',
  'scholarship_approved',
  'scholarship_rejected',
  'scholarship_expired',
  'enrollment_confirmed',
  'course_completed',
  'certificate_issued',
  'credits_earned',
  'payment_received',
  'payment_approved',
  'payment_rejected',
  'general',
  -- Organization portal
  'new_application',
  'application_status_changed',
  'application_withdrawn'
));

COMMENT ON COLUMN public.notifications.scope IS 'personal = user-level; organization = visible only in org portal for this org';
COMMENT ON COLUMN public.notifications.organization_id IS 'Set when scope = organization; which org this notification belongs to';
