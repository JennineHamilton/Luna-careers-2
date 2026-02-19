-- =====================================================
-- Phase 2: LMS Database Functions & Triggers
-- =====================================================
-- This migration creates all database functions and triggers
-- for the Luna Careers LMS system.
-- =====================================================

-- =====================================================
-- A. AUTO-COMPUTE DURATION FUNCTIONS
-- =====================================================

-- Function: Compute Module Duration
CREATE OR REPLACE FUNCTION compute_module_duration(p_module_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(l.duration_minutes), 0)::INTEGER
  FROM module_lessons ml
  JOIN lessons l ON ml.lesson_id = l.id
  WHERE ml.module_id = p_module_id;
$$ LANGUAGE SQL;

-- Function: Compute Course Duration
CREATE OR REPLACE FUNCTION compute_course_duration(p_course_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(m.duration_minutes), 0)::INTEGER
  FROM course_modules cm
  JOIN modules m ON cm.module_id = m.id
  WHERE cm.course_id = p_course_id;
$$ LANGUAGE SQL;

-- Function: Compute Program Duration
CREATE OR REPLACE FUNCTION compute_program_duration(p_program_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(c.duration_minutes), 0)::INTEGER
  FROM program_courses pc
  JOIN courses c ON pc.course_id = c.id
  WHERE pc.program_id = p_program_id;
$$ LANGUAGE SQL;

-- Trigger: Update Module Duration on Lesson Changes
CREATE OR REPLACE FUNCTION update_module_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE modules
  SET duration_minutes = compute_module_duration(COALESCE(NEW.module_id, OLD.module_id)),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.module_id, OLD.module_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_module_duration
AFTER INSERT OR UPDATE OR DELETE ON module_lessons
FOR EACH ROW EXECUTE FUNCTION update_module_duration();

-- Trigger: Update Course Duration on Module Changes
CREATE OR REPLACE FUNCTION update_course_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET duration_minutes = compute_course_duration(COALESCE(NEW.course_id, OLD.course_id)),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_duration
AFTER INSERT OR UPDATE OR DELETE ON course_modules
FOR EACH ROW EXECUTE FUNCTION update_course_duration();

-- Trigger: Update Program Duration on Course Changes
CREATE OR REPLACE FUNCTION update_program_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE programs
  SET duration_minutes = compute_program_duration(COALESCE(NEW.program_id, OLD.program_id)),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.program_id, OLD.program_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_program_duration
AFTER INSERT OR UPDATE OR DELETE ON program_courses
FOR EACH ROW EXECUTE FUNCTION update_program_duration();

-- =====================================================
-- B. CREDIT TRANSACTION FUNCTIONS
-- =====================================================

-- Function: Award Credits
CREATE OR REPLACE FUNCTION award_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_source_type VARCHAR,
  p_source_id UUID,
  p_description TEXT
)
RETURNS VOID AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update wallet
  UPDATE credit_wallets
  SET balance = balance + p_amount,
      lifetime_earned = lifetime_earned + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after,
    source_type, source_id, description
  ) VALUES (
    p_user_id, 'earned', p_amount, v_new_balance,
    p_source_type, p_source_id, p_description
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Spend Credits
CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_source_type VARCHAR,
  p_source_id UUID,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check balance
  SELECT balance INTO v_current_balance
  FROM credit_wallets
  WHERE user_id = p_user_id;
  
  IF v_current_balance < p_amount THEN
    RETURN FALSE; -- Insufficient funds
  END IF;
  
  -- Update wallet
  UPDATE credit_wallets
  SET balance = balance - p_amount,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after,
    source_type, source_id, description
  ) VALUES (
    p_user_id, 'spent', -p_amount, v_new_balance,
    p_source_type, p_source_id, p_description
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- C. PROGRESS CALCULATION FUNCTIONS
-- =====================================================

-- Function: Calculate Module Progress
CREATE OR REPLACE FUNCTION calculate_module_progress(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_required_lessons INTEGER;
  v_completed_required INTEGER;
  v_completion_percentage INTEGER;
  v_status VARCHAR(20);
BEGIN
  -- Count total and required lessons
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_required = true)
  INTO v_total_lessons, v_required_lessons
  FROM module_lessons
  WHERE module_id = p_module_id;

  -- Count completed lessons
  SELECT
    COUNT(*) FILTER (WHERE lp.status IN ('completed', 'passed')),
    COUNT(*) FILTER (WHERE ml.is_required = true AND lp.status IN ('completed', 'passed'))
  INTO v_completed_lessons, v_completed_required
  FROM module_lessons ml
  LEFT JOIN lesson_progress lp ON ml.lesson_id = lp.lesson_id AND lp.user_id = p_user_id
  WHERE ml.module_id = p_module_id;

  -- Calculate completion percentage (based on required lessons)
  IF v_required_lessons > 0 THEN
    v_completion_percentage := (v_completed_required * 100) / v_required_lessons;
  ELSE
    v_completion_percentage := 0;
  END IF;

  -- Determine status
  IF v_completion_percentage = 100 THEN
    v_status := 'completed';
  ELSIF v_completion_percentage > 0 THEN
    v_status := 'in_progress';
  ELSE
    v_status := 'not_started';
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'completion_percentage', v_completion_percentage,
    'total_lessons', v_total_lessons,
    'completed_lessons', v_completed_lessons,
    'required_lessons', v_required_lessons,
    'completed_required', v_completed_required
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Course Progress
CREATE OR REPLACE FUNCTION calculate_course_progress(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_total_modules INTEGER;
  v_completed_modules INTEGER;
  v_required_modules INTEGER;
  v_completed_required INTEGER;
  v_completion_percentage INTEGER;
  v_status VARCHAR(20);
BEGIN
  -- Count total and required modules
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_required = true)
  INTO v_total_modules, v_required_modules
  FROM course_modules
  WHERE course_id = p_course_id;

  -- Count completed modules
  SELECT
    COUNT(*) FILTER (WHERE mp.status = 'completed'),
    COUNT(*) FILTER (WHERE cm.is_required = true AND mp.status = 'completed')
  INTO v_completed_modules, v_completed_required
  FROM course_modules cm
  LEFT JOIN module_progress mp ON cm.module_id = mp.module_id AND mp.user_id = p_user_id
  WHERE cm.course_id = p_course_id;

  -- Calculate completion percentage (based on required modules)
  IF v_required_modules > 0 THEN
    v_completion_percentage := (v_completed_required * 100) / v_required_modules;
  ELSE
    v_completion_percentage := 0;
  END IF;

  -- Determine status
  IF v_completion_percentage = 100 THEN
    v_status := 'completed';
  ELSIF v_completion_percentage > 0 THEN
    v_status := 'in_progress';
  ELSE
    v_status := 'not_started';
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'completion_percentage', v_completion_percentage,
    'total_modules', v_total_modules,
    'completed_modules', v_completed_modules,
    'required_modules', v_required_modules,
    'completed_required', v_completed_required
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Program Progress
CREATE OR REPLACE FUNCTION calculate_program_progress(
  p_user_id UUID,
  p_program_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_total_courses INTEGER;
  v_completed_courses INTEGER;
  v_required_courses INTEGER;
  v_completed_required INTEGER;
  v_completion_percentage INTEGER;
  v_status VARCHAR(20);
BEGIN
  -- Count total and required courses
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_required = true)
  INTO v_total_courses, v_required_courses
  FROM program_courses
  WHERE program_id = p_program_id;

  -- Count completed courses
  SELECT
    COUNT(*) FILTER (WHERE cp.status = 'completed'),
    COUNT(*) FILTER (WHERE pc.is_required = true AND cp.status = 'completed')
  INTO v_completed_courses, v_completed_required
  FROM program_courses pc
  LEFT JOIN course_progress cp ON pc.course_id = cp.course_id AND cp.user_id = p_user_id
  WHERE pc.program_id = p_program_id;

  -- Calculate completion percentage (based on required courses)
  IF v_required_courses > 0 THEN
    v_completion_percentage := (v_completed_required * 100) / v_required_courses;
  ELSE
    v_completion_percentage := 0;
  END IF;

  -- Determine status
  IF v_completion_percentage = 100 THEN
    v_status := 'completed';
  ELSIF v_completion_percentage > 0 THEN
    v_status := 'in_progress';
  ELSE
    v_status := 'not_started';
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'completion_percentage', v_completion_percentage,
    'total_courses', v_total_courses,
    'completed_courses', v_completed_courses,
    'required_courses', v_required_courses,
    'completed_required', v_completed_required
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- D. ENROLLMENT & COMPLETION TRIGGERS
-- =====================================================

-- Trigger: Auto-create credit wallet for new users
CREATE OR REPLACE FUNCTION create_credit_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_credit_wallet
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_credit_wallet_for_new_user();

-- Trigger: Update module progress when lesson progress changes
CREATE OR REPLACE FUNCTION update_module_progress_on_lesson_change()
RETURNS TRIGGER AS $$
DECLARE
  v_module_id UUID;
  v_progress JSONB;
BEGIN
  -- Find all modules containing this lesson
  FOR v_module_id IN
    SELECT module_id FROM module_lessons WHERE lesson_id = NEW.lesson_id
  LOOP
    -- Calculate progress
    v_progress := calculate_module_progress(NEW.user_id, v_module_id);

    -- Upsert module_progress
    INSERT INTO module_progress (
      user_id, module_id, status, completion_percentage,
      started_at, completed_at, updated_at
    ) VALUES (
      NEW.user_id,
      v_module_id,
      (v_progress->>'status')::VARCHAR,
      (v_progress->>'completion_percentage')::INTEGER,
      CASE WHEN (v_progress->>'status')::VARCHAR != 'not_started' THEN COALESCE((SELECT started_at FROM module_progress WHERE user_id = NEW.user_id AND module_id = v_module_id), NOW()) ELSE NULL END,
      CASE WHEN (v_progress->>'status')::VARCHAR = 'completed' THEN NOW() ELSE NULL END,
      NOW()
    )
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      status = (v_progress->>'status')::VARCHAR,
      completion_percentage = (v_progress->>'completion_percentage')::INTEGER,
      completed_at = CASE WHEN (v_progress->>'status')::VARCHAR = 'completed' THEN NOW() ELSE module_progress.completed_at END,
      updated_at = NOW();
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_module_progress
AFTER INSERT OR UPDATE ON lesson_progress
FOR EACH ROW EXECUTE FUNCTION update_module_progress_on_lesson_change();

-- Trigger: Update course progress when module progress changes
CREATE OR REPLACE FUNCTION update_course_progress_on_module_change()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_progress JSONB;
BEGIN
  -- Find all courses containing this module
  FOR v_course_id IN
    SELECT course_id FROM course_modules WHERE module_id = NEW.module_id
  LOOP
    -- Calculate progress
    v_progress := calculate_course_progress(NEW.user_id, v_course_id);

    -- Upsert course_progress
    INSERT INTO course_progress (
      user_id, course_id, status, completion_percentage,
      started_at, completed_at, updated_at
    ) VALUES (
      NEW.user_id,
      v_course_id,
      (v_progress->>'status')::VARCHAR,
      (v_progress->>'completion_percentage')::INTEGER,
      CASE WHEN (v_progress->>'status')::VARCHAR != 'not_started' THEN COALESCE((SELECT started_at FROM course_progress WHERE user_id = NEW.user_id AND course_id = v_course_id), NOW()) ELSE NULL END,
      CASE WHEN (v_progress->>'status')::VARCHAR = 'completed' THEN NOW() ELSE NULL END,
      NOW()
    )
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      status = (v_progress->>'status')::VARCHAR,
      completion_percentage = (v_progress->>'completion_percentage')::INTEGER,
      completed_at = CASE WHEN (v_progress->>'status')::VARCHAR = 'completed' THEN NOW() ELSE course_progress.completed_at END,
      updated_at = NOW();
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_progress
AFTER INSERT OR UPDATE ON module_progress
FOR EACH ROW EXECUTE FUNCTION update_course_progress_on_module_change();

-- Trigger: Update program progress when course progress changes
CREATE OR REPLACE FUNCTION update_program_progress_on_course_change()
RETURNS TRIGGER AS $$
DECLARE
  v_program_id UUID;
  v_progress JSONB;
BEGIN
  -- Find all programs containing this course
  FOR v_program_id IN
    SELECT program_id FROM program_courses WHERE course_id = NEW.course_id
  LOOP
    -- Calculate progress
    v_progress := calculate_program_progress(NEW.user_id, v_program_id);

    -- Upsert program_progress
    INSERT INTO program_progress (
      user_id, program_id, status, completion_percentage,
      started_at, completed_at, updated_at
    ) VALUES (
      NEW.user_id,
      v_program_id,
      (v_progress->>'status')::VARCHAR,
      (v_progress->>'completion_percentage')::INTEGER,
      CASE WHEN (v_progress->>'status')::VARCHAR != 'not_started' THEN COALESCE((SELECT started_at FROM program_progress WHERE user_id = NEW.user_id AND program_id = v_program_id), NOW()) ELSE NULL END,
      CASE WHEN (v_progress->>'status')::VARCHAR = 'completed' THEN NOW() ELSE NULL END,
      NOW()
    )
    ON CONFLICT (user_id, program_id) DO UPDATE SET
      status = (v_progress->>'status')::VARCHAR,
      completion_percentage = (v_progress->>'completion_percentage')::INTEGER,
      completed_at = CASE WHEN (v_progress->>'status')::VARCHAR = 'completed' THEN NOW() ELSE program_progress.completed_at END,
      updated_at = NOW();
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_program_progress
AFTER INSERT OR UPDATE ON course_progress
FOR EACH ROW EXECUTE FUNCTION update_program_progress_on_course_change();
