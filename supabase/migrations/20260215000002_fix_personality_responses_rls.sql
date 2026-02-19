-- Fix RLS policy for personality_responses table
-- The issue is that the WITH CHECK clause needs to properly verify
-- that the attempt belongs to the authenticated user

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own personality responses" ON personality_responses;

-- Create new policy with corrected logic
-- The key is to ensure the subquery can properly access the attempt data
CREATE POLICY "Users can insert own personality responses"
  ON personality_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM personality_attempts
      WHERE personality_attempts.id = attempt_id
      AND personality_attempts.user_id = auth.uid()
    )
  );

-- Also update the SELECT policy to use the same pattern for consistency
DROP POLICY IF EXISTS "Users can view own personality responses" ON personality_responses;

CREATE POLICY "Users can view own personality responses"
  ON personality_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM personality_attempts
      WHERE personality_attempts.id = personality_responses.attempt_id
      AND personality_attempts.user_id = auth.uid()
    )
  );

-- Add UPDATE policy for upsert operations
CREATE POLICY "Users can update own personality responses"
  ON personality_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM personality_attempts
      WHERE personality_attempts.id = personality_responses.attempt_id
      AND personality_attempts.user_id = auth.uid()
    )
  );

