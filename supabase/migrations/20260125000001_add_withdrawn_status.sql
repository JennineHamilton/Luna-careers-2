-- Migration: Add 'withdrawn' status to scholarship_applications
-- Date: 2026-01-25
-- Description: Adds 'withdrawn' as a valid status for scholarship applications

-- Add 'withdrawn' to the status check constraint
-- First, we need to drop the existing constraint if it exists
ALTER TABLE scholarship_applications 
DROP CONSTRAINT IF EXISTS scholarship_applications_status_check;

-- Add the new constraint with 'withdrawn' included
ALTER TABLE scholarship_applications
ADD CONSTRAINT scholarship_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'withdrawn'));

-- Add comment to document the status values
COMMENT ON COLUMN scholarship_applications.status IS 
'Application status: pending (under review), approved (scholarship granted), rejected (denied), expired (approval expired), withdrawn (user cancelled application)';

