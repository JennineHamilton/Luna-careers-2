import { createClient } from '@/lib/supabase/server';
import { ModuleDetailsClient } from './module-details-client';
import { notFound } from 'next/navigation';
import type { Database } from '@/types/database.types';

type Module = Database['public']['Tables']['modules']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];
type Quiz = Database['public']['Tables']['quizzes']['Row'];

interface ModuleWithDetails extends Module {
  creators: Creator | null;
  module_lessons: Array<{
    id: string;
    sort_order: number;
    is_required: boolean | null;
    lessons: Lesson;
  }>;
  module_quizzes?: Array<{
    quiz_id: string;
    sort_order: number;
    is_required: boolean | null;
    quizzes: Quiz & {
      question_count?: number;
    };
  }> | null;
}

export default async function ModuleDetailsPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all skills for mapping UUIDs to names
  const { data: allSkills } = await supabase
    .from('skills')
    .select('id, name, category');

  // Create a skill lookup map
  const skillMap = new Map(
    (allSkills || []).map(skill => [skill.id, { name: skill.name, category: skill.category }])
  );

  // Fetch module with creator, lessons, and quizzes
  const { data: moduleRaw, error } = await supabase
    .from('modules')
    .select(`
      *,
      creators(id, name, logo_url, bio, verified),
      module_lessons(
        id,
        sort_order,
        is_required,
        lessons(id, title, description, scorm_package_url, scorm_version, duration_minutes, creator_id, created_at, updated_at, scorm_launch_url, scorm_extraction_status, scorm_extraction_error, scorm_extracted_at)
      ),
      module_quizzes(
        quiz_id,
        sort_order,
        is_required,
        quizzes(id, name, description, duration_minutes, number_of_questions, is_graded, passing_score, created_at, updated_at)
      )
    `)
    .eq('id', moduleId)
    .eq('is_published', true)
    .single();

  if (error || !moduleRaw) {
    console.error('Error fetching module:', error);
    console.log('Module ID:', moduleId);
    notFound();
  }

  // Convert skill UUIDs to full skill objects
  const convertSkillsToObjects = (skills: any): Array<{ id: string; name: string; category: string }> => {
    if (!Array.isArray(skills)) return [];

    return skills
      .map((s: any) => {
        if (typeof s === 'string') {
          // It's a UUID, look it up
          const skillData = skillMap.get(s);
          return skillData ? { id: s, name: skillData.name, category: skillData.category } : null;
        }
        if (s?.name) return s; // Already an object with name
        if (s?.id) {
          const skillData = skillMap.get(s.id);
          return skillData ? { id: s.id, name: skillData.name, category: skillData.category } : null;
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: string; name: string; category: string }>;
  };

  // Convert skills UUIDs to full objects
  const module = {
    ...moduleRaw,
    skills: convertSkillsToObjects(moduleRaw.skills)
  };

  // Fetch user's module progress if logged in
  let moduleProgress = null;
  let lessonProgress: any[] = [];
  let quizAttempts: any[] = [];
  let enrollment = null;
  let creditBalance = 0;
  let awardedScholarship = null;
  let enrolledCourseId: string | null = null;

  if (user) {
    // Check if user is enrolled directly in the module
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('enrollment_type', 'module')
      .eq('enrollment_id', moduleId)
      .single();

    enrollment = enrollmentData;

    // If not directly enrolled in module, check if enrolled via a course
    if (!enrollment) {
      // Find ALL courses that contain this module
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('course_id')
        .eq('module_id', moduleId);

      if (courseModules && courseModules.length > 0) {
        const courseIds = courseModules
          .map(cm => cm.course_id)
          .filter((id): id is string => id !== null);

        if (courseIds.length > 0) {
          // Check if user is enrolled in ANY of these courses
          const { data: courseEnrollment } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('enrollment_type', 'course')
            .in('enrollment_id', courseIds)
            .limit(1)
            .single();

          // If enrolled via course, use that enrollment and store the course ID
          if (courseEnrollment) {
            enrollment = courseEnrollment;
            enrolledCourseId = courseEnrollment.enrollment_id;
          }
        }
      }
    }

    // Fetch credit balance
    const { data: wallet } = await supabase
      .from('credit_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    creditBalance = wallet?.balance || 0;

    const { data: progress } = await supabase
      .from('module_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .single();

    moduleProgress = progress;

    // Fetch lesson progress
    const lessonIds = module.module_lessons.map((ml: any) => ml.lessons.id);
    if (lessonIds.length > 0) {
      const { data: lessons } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      lessonProgress = lessons || [];
    }

    // Fetch quiz attempts
    const quizIds = (module.module_quizzes || []).map((mq: any) => mq.quizzes.id);
    if (quizIds.length > 0) {
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .in('quiz_id', quizIds)
        .order('started_at', { ascending: false });

      quizAttempts = attempts || [];
    }

    // Fetch awarded scholarship for this module (always check, not just from URL)
    const { data: scholarship } = await supabase
      .from('awarded_scholarships')
      .select(`
        *,
        scholarships (
          id,
          name,
          type,
          discount_percentage
        )
      `)
      .eq('user_id', user.id)
      .eq('content_type', 'module')
      .eq('content_id', moduleId)
      .eq('used', false)
      .maybeSingle();

    awardedScholarship = scholarship;
  }

  return (
    <ModuleDetailsClient
      module={module as ModuleWithDetails}
      moduleProgress={moduleProgress}
      lessonProgress={lessonProgress}
      quizAttempts={quizAttempts}
      userId={user?.id}
      enrollment={enrollment}
      creditBalance={creditBalance}
      awardedScholarship={awardedScholarship}
      enrolledCourseId={enrolledCourseId}
    />
  );
}

