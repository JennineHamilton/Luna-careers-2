-- =====================================================
-- REMOVE PRE-SCREENING ASSESSMENT ENGINE
-- =====================================================
-- This migration removes all database objects related to
-- the pre-screening assessment engine
-- =====================================================

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can view active assessments" ON assessments;
DROP POLICY IF EXISTS "Platform admins can manage all assessments" ON assessments;
DROP POLICY IF EXISTS "Users can view their own results" ON assessment_results;
DROP POLICY IF EXISTS "Users can insert their own results" ON assessment_results;
DROP POLICY IF EXISTS "Platform admins can view all results" ON assessment_results;
DROP POLICY IF EXISTS "Users can view their own history" ON user_assessment_history;
DROP POLICY IF EXISTS "Users can insert their own history" ON user_assessment_history;
DROP POLICY IF EXISTS "Users can update their own history" ON user_assessment_history;
DROP POLICY IF EXISTS "Platform admins can view all history" ON user_assessment_history;
DROP POLICY IF EXISTS "Users can view content for their assessments" ON content_library;
DROP POLICY IF EXISTS "Platform admins can manage content library" ON content_library;

-- Drop indexes
DROP INDEX IF EXISTS idx_assessments_type;
DROP INDEX IF EXISTS idx_assessments_status;
DROP INDEX IF EXISTS idx_assessments_category;
DROP INDEX IF EXISTS idx_assessments_created_by;
DROP INDEX IF EXISTS idx_assessment_results_user_id;
DROP INDEX IF EXISTS idx_assessment_results_assessment_id;
DROP INDEX IF EXISTS idx_assessment_results_content_hash;
DROP INDEX IF EXISTS idx_user_history_user_assessment;
DROP INDEX IF EXISTS idx_user_history_status;
DROP INDEX IF EXISTS idx_user_history_content_hash;
DROP INDEX IF EXISTS idx_one_official_score_per_user_assessment;
DROP INDEX IF EXISTS idx_user_history_official_scores;
DROP INDEX IF EXISTS idx_content_library_assessment;
DROP INDEX IF EXISTS idx_content_library_type;
DROP INDEX IF EXISTS idx_content_library_hash;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_percentile_rank(UUID, DECIMAL);
DROP FUNCTION IF EXISTS has_user_seen_content(UUID, UUID, VARCHAR);
DROP FUNCTION IF EXISTS get_next_assessment_attempt_number(UUID, UUID);
DROP FUNCTION IF EXISTS increment_content_usage(UUID, UUID);
DROP FUNCTION IF EXISTS get_assessment_statistics(UUID);

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS assessment_results CASCADE;
DROP TABLE IF EXISTS user_assessment_history CASCADE;
DROP TABLE IF EXISTS content_library CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;

-- Log the removal
DO $$
BEGIN
  RAISE NOTICE '✅ Pre-screening assessment engine removed successfully';
  RAISE NOTICE '   - Dropped 4 tables: assessments, assessment_results, user_assessment_history, content_library';
  RAISE NOTICE '   - Dropped 5 functions';
  RAISE NOTICE '   - Dropped all RLS policies';
  RAISE NOTICE '   - Dropped all indexes';
END $$;

