-- =====================================================
-- Add INSERT Policy for user_skill_badges
-- Migration: 20260214000004
-- Description: Allow authenticated users to insert their own skill badges
-- =====================================================

-- Users can insert their own skill badges
CREATE POLICY "Users can insert their own skill badges"
  ON user_skill_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

