/**
 * Migration: Fix module_quizzes RLS policies
 * Updates RLS policies to use is_platform_admin() function instead of JWT check
 * This matches the pattern used by module_lessons
 */

-- Drop existing policies
DROP POLICY IF EXISTS module_quizzes_read_all ON module_quizzes;
DROP POLICY IF EXISTS module_quizzes_insert_platform_admin ON module_quizzes;
DROP POLICY IF EXISTS module_quizzes_update_platform_admin ON module_quizzes;
DROP POLICY IF EXISTS module_quizzes_delete_platform_admin ON module_quizzes;

-- Create new policies using is_platform_admin() function
CREATE POLICY "Everyone can view module quizzes"
  ON module_quizzes FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage module quizzes"
  ON module_quizzes FOR ALL
  USING (is_platform_admin());

