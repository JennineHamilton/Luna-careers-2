import { createClient } from '@/lib/supabase/server';
import { CourseDetailsClient } from './course-details-client';
import { notFound } from 'next/navigation';
import type { Database } from '@/types/database.types';

type Course = Database['public']['Tables']['courses']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];

interface CourseWithDetails extends Course {
  creators: Creator | null;
  course_modules: Array<{
    id: string;
    sort_order: number;
    is_required: boolean | null;
    modules: {
      id: string;
      title: string;
      description: string;
      duration_minutes: number | null;
      cover_image_url: string | null;
      level: string;
      module_lessons: Array<{
        id: string;
        sort_order: number;
        is_required: boolean | null;
        lessons: {
          id: string;
          title: string;
          duration_minutes: number | null;
        } | null;
      }>;
      module_quizzes: Array<{
        id: string;
        sort_order: number;
        is_required: boolean | null;
        quizzes: {
          id: string;
          name: string;
          duration_minutes: number | null;
          number_of_questions: number;
        } | null;
      }>;
    } | null;
  }>;
}

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch course with creator, modules, lessons, and quizzes
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      creators(id, name, logo_url, bio, verified),
      course_modules(
        id,
        sort_order,
        is_required,
        modules(
          id,
          title,
          description,
          duration_minutes,
          cover_image_url,
          level,
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
        )
      )
    `)
    .eq('id', courseId)
    .eq('is_published', true)
    .single();

  if (error || !course) {
    console.error('Error fetching course:', error);
    notFound();
  }

  // Fetch all skills for mapping UUIDs to names
  const { data: allSkills } = await supabase
    .from('skills')
    .select('id, name, category');

  // Create a skill lookup map
  const skillMap = new Map(
    (allSkills || []).map(skill => [skill.id, skill.name])
  );

  // Helper function to convert skill UUIDs to names
  const convertSkillsToNames = (skills: any): string[] => {
    if (!Array.isArray(skills)) return [];

    return skills
      .map((s: any) => {
        if (typeof s === 'string') {
          // It's a UUID, look it up
          return skillMap.get(s) || null;
        }
        if (s?.name) return s.name;
        if (s?.id) return skillMap.get(s.id) || null;
        return null;
      })
      .filter(Boolean) as string[];
  };

  // Convert course skills to names
  const courseSkillNames = convertSkillsToNames(course.skills);

  // Fetch user's course progress if logged in
  let courseProgress = null;
  let moduleProgress: any[] = [];
  let lessonProgress: any[] = [];
  let quizAttempts: any[] = [];
  let enrollment = null;
  let creditBalance = 0;
  let awardedScholarship = null;

  if (user) {
    // Check if user is enrolled directly in the course
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('enrollment_type', 'course')
      .eq('enrollment_id', courseId)
      .single();

    enrollment = enrollmentData;

    // If not directly enrolled, check if enrolled via parent program
    if (!enrollment) {
      // Find programs that contain this course
      const { data: programCourses } = await supabase
        .from('program_courses')
        .select('program_id')
        .eq('course_id', courseId);

      if (programCourses && programCourses.length > 0) {
        const programIds = programCourses
          .map(pc => pc.program_id)
          .filter((id): id is string => id !== null);

        if (programIds.length > 0) {
          // Check if user is enrolled in any of these programs
          const { data: programEnrollment } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('enrollment_type', 'program')
            .in('enrollment_id', programIds)
            .limit(1)
            .single();

          // If enrolled via program, use that enrollment
          if (programEnrollment) {
            enrollment = programEnrollment;
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
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    courseProgress = progress;

    // Fetch module progress
    const moduleIds = course.course_modules
      .filter((cm: any) => cm.modules) // Filter out null modules
      .map((cm: any) => cm.modules.id);
    if (moduleIds.length > 0) {
      const { data: modules } = await supabase
        .from('module_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('module_id', moduleIds);

      moduleProgress = modules || [];
    }

    // Fetch lesson progress for all lessons in all modules
    const lessonIds: string[] = [];
    course.course_modules.forEach((cm: any) => {
      if (cm.modules?.module_lessons) {
        cm.modules.module_lessons.forEach((ml: any) => {
          if (ml.lessons?.id) {
            lessonIds.push(ml.lessons.id);
          }
        });
      }
    });

    if (lessonIds.length > 0) {
      const { data: lessons } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      lessonProgress = lessons || [];
    }

    // Fetch quiz attempts for all quizzes in all modules
    const quizIds: string[] = [];
    course.course_modules.forEach((cm: any) => {
      if (cm.modules?.module_quizzes) {
        cm.modules.module_quizzes.forEach((mq: any) => {
          if (mq.quiz_id) {
            quizIds.push(mq.quiz_id);
          }
        });
      }
    });

    if (quizIds.length > 0) {
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .in('quiz_id', quizIds)
        .order('created_at', { ascending: false });

      quizAttempts = attempts || [];
    }

    // Fetch awarded scholarship for this course (always check, not just from URL)
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
      .eq('content_type', 'course')
      .eq('content_id', courseId)
      .eq('used', false)
      .maybeSingle();

    awardedScholarship = scholarship;
  }

  return (
    <CourseDetailsClient
      course={course as CourseWithDetails}
      courseProgress={courseProgress}
      moduleProgress={moduleProgress}
      lessonProgress={lessonProgress}
      quizAttempts={quizAttempts}
      userId={user?.id}
      enrollment={enrollment}
      creditBalance={creditBalance}
      awardedScholarship={awardedScholarship}
      skillNames={courseSkillNames}
    />
  );
}

