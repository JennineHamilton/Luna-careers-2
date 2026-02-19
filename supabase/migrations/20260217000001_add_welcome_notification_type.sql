-- ============================================================
-- Luna Careers - Add Welcome Notification Type
-- Migration: 20260217000001
-- Description: Adds 'welcome' and 'payment_approved' to allowed notification types
-- ============================================================

-- Drop the existing constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with additional types
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
  'general'
));

COMMENT ON CONSTRAINT notifications_type_check ON public.notifications IS 'Allowed notification types including welcome message';

