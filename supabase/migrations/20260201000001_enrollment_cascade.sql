-- Migration: Automatic Enrollment Cascade
-- When user enrolls in a program, auto-enroll in all courses
-- When user enrolls in a course, auto-enroll in all modules

-- Function to auto-enroll in courses when enrolling in a program
CREATE OR REPLACE FUNCTION auto_enroll_program_courses()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is a program enrollment
  IF NEW.enrollment_type = 'program' THEN
    -- Insert enrollments for all courses in the program
    INSERT INTO enrollments (
      user_id,
      enrollment_type,
      enrollment_id,
      enrolled_at,
      status
    )
    SELECT
      NEW.user_id,
      'course',
      pc.course_id,
      NEW.enrolled_at,
      'active'
    FROM program_courses pc
    WHERE pc.program_id = NEW.enrollment_id
    ON CONFLICT (user_id, enrollment_type, enrollment_id) DO NOTHING;
    
    RAISE NOTICE 'Auto-enrolled user % in courses for program %', NEW.user_id, NEW.enrollment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-enroll in modules when enrolling in a course
CREATE OR REPLACE FUNCTION auto_enroll_course_modules()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is a course enrollment
  IF NEW.enrollment_type = 'course' THEN
    -- Insert enrollments for all modules in the course
    INSERT INTO enrollments (
      user_id,
      enrollment_type,
      enrollment_id,
      enrolled_at,
      status
    )
    SELECT
      NEW.user_id,
      'module',
      cm.module_id,
      NEW.enrolled_at,
      'active'
    FROM course_modules cm
    WHERE cm.course_id = NEW.enrollment_id
    ON CONFLICT (user_id, enrollment_type, enrollment_id) DO NOTHING;
    
    RAISE NOTICE 'Auto-enrolled user % in modules for course %', NEW.user_id, NEW.enrollment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_auto_enroll_program_courses ON enrollments;
CREATE TRIGGER trigger_auto_enroll_program_courses
  AFTER INSERT ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION auto_enroll_program_courses();

DROP TRIGGER IF EXISTS trigger_auto_enroll_course_modules ON enrollments;
CREATE TRIGGER trigger_auto_enroll_course_modules
  AFTER INSERT ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION auto_enroll_course_modules();

-- Add comment
COMMENT ON FUNCTION auto_enroll_program_courses() IS 'Automatically enrolls user in all courses when they enroll in a program';
COMMENT ON FUNCTION auto_enroll_course_modules() IS 'Automatically enrolls user in all modules when they enroll in a course';

