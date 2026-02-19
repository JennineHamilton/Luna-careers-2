-- =====================================================
-- Fix Bank Transfer Submissions Foreign Keys
-- Migration: 20260124000004
-- Description: Change user_id foreign key to reference public.users instead of auth.users
--              so PostgREST can follow the relationship
-- =====================================================

-- Drop the existing foreign key constraint
ALTER TABLE bank_transfer_submissions
  DROP CONSTRAINT IF EXISTS bank_transfer_submissions_user_id_fkey;

ALTER TABLE bank_transfer_submissions
  DROP CONSTRAINT IF EXISTS bank_transfer_submissions_reviewed_by_fkey;

-- Add new foreign key constraints to public.users
ALTER TABLE bank_transfer_submissions
  ADD CONSTRAINT bank_transfer_submissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE bank_transfer_submissions
  ADD CONSTRAINT bank_transfer_submissions_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;

