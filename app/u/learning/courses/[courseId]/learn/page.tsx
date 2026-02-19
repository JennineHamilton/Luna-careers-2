import { createClient } from '@/lib/supabase/server';
import { CourseLearnClient } from './course-learn-client';
import { notFound, redirect } from 'next/navigation';
import type { Database } from '@/types/database.types';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

// Enable dynamic rendering but with revalidation
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = 'force-dynamic'; // Always fetch fresh data for progress

export default async function CourseLearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string; module?: string; quiz?: string }>;
}) {
  const { courseId } = await params;
  const { lesson: lessonId, module: moduleId, quiz: quizId } = await searchParams;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Parallelize enrollment check and course fetch (both needed before progress queries)
  const [enrollmentResult, courseResult] = await Promise.all([
    supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('enrollment_type', 'course')
      .eq('enrollment_id', courseId)
      .single(),
    supabase
      .from('courses')
      .select(`
        *,
        course_modules(
          id,
          sort_order,
          is_required,
          modules(
            id,
            title,
            description,
            cover_image_url,
            module_lessons(
              id,
              sort_order,
              is_required,
              lessons(
                id,
                title,
                description,
                duration_minutes,
                scorm_package_url,
                scorm_version,
                scorm_launch_url
              )
            ),
            module_quizzes(
              quiz_id,
              sort_order,
              is_required,
              quizzes(
                id,
                name,
                description,
                duration_minutes,
                number_of_questions,
                is_graded,
                passing_score
              )
            )
          )
        )
      `)
      .eq('id', courseId)
      .single()
  ]);

  const { data: enrollment } = enrollmentResult;
  const { data: course, error } = courseResult;

  if (!enrollment) {
    // Not enrolled, redirect to course details
    redirect(`/u/learning/courses/${courseId}`);
  }

  if (error || !course) {
    notFound();
  }

  // Extract lesson, module, and quiz IDs from course structure for filtered queries
  const lessonIds: string[] = [];
  const moduleIds: string[] = [];
  const quizIds: string[] = [];

  course.course_modules?.forEach((cm: any) => {
    if (cm.modules) {
      moduleIds.push(cm.modules.id);
      cm.modules.module_lessons?.forEach((ml: any) => {
        if (ml.lessons) {
          lessonIds.push(ml.lessons.id);
        }
      });
      cm.modules.module_quizzes?.forEach((mq: any) => {
        if (mq.quizzes) {
          quizIds.push(mq.quizzes.id);
        }
      });
    }
  });

  // Parallelize progress queries - only fetch data for THIS course
  const [lessonProgressResult, moduleProgressResult, courseProgressResult, quizAttemptsResult] = await Promise.all([
    lessonIds.length > 0
      ? supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds)
      : Promise.resolve({ data: [] }),
    moduleIds.length > 0
      ? supabase
          .from('module_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('module_id', moduleIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single(),
    quizIds.length > 0
      ? supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .in('quiz_id', quizIds)
          .order('started_at', { ascending: false })
      : Promise.resolve({ data: [] })
  ]);

  const { data: lessonProgress } = lessonProgressResult;
  const { data: moduleProgress } = moduleProgressResult;
  const { data: courseProgress } = courseProgressResult;
  const { data: quizAttempts } = quizAttemptsResult;

  // Helper function to check if a module is unlocked
  const isModuleUnlocked = (moduleIndex: number, moduleId: string): boolean => {
    // First module is always unlocked
    if (moduleIndex === 0) return true;

    // Check if previous module is completed
    const sortedModules = (course.course_modules || [])
      .filter((cm: any) => cm.modules)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);

    if (moduleIndex > 0) {
      const previousModule = sortedModules[moduleIndex - 1]?.modules;
      if (previousModule) {
        const previousModuleProgress = moduleProgress?.find((mp: any) => mp.module_id === previousModule.id);
        return previousModuleProgress?.status === 'completed';
      }
    }

    return false;
  };

  // Helper function to check if a lesson is unlocked within a module
  const isLessonUnlocked = (moduleId: string, lessonIndex: number, lessonId: string): boolean => {
    // First lesson is always unlocked
    if (lessonIndex === 0) return true;

    // Find the module
    const moduleData = (course.course_modules || [])
      .filter((cm: any) => cm.modules)
      .find((cm: any) => cm.modules.id === moduleId);

    if (!moduleData || !moduleData.modules) return false;

    const sortedLessons = (moduleData.modules.module_lessons || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .filter((ml: any) => ml.lessons);

    if (lessonIndex > 0) {
      const previousLesson = sortedLessons[lessonIndex - 1]?.lessons;
      if (previousLesson) {
        const previousLessonProgress = lessonProgress?.find((lp: any) => lp.lesson_id === previousLesson.id);
        return previousLessonProgress?.status === 'completed' || previousLessonProgress?.status === 'passed';
      }
    }

    return false;
  };

  // Determine which lesson to show
  let currentLessonId: string | undefined = lessonId;
  let currentModuleId: string | undefined = moduleId;

  // Validate that the requested module and lesson are unlocked
  if (currentModuleId && currentLessonId) {
    const sortedModules = (course.course_modules || [])
      .filter((cm: any) => cm.modules)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);

    const requestedModuleIndex = sortedModules.findIndex((cm: any) => cm.modules.id === currentModuleId);

    // Check if module is unlocked
    if (requestedModuleIndex > 0 && !isModuleUnlocked(requestedModuleIndex, currentModuleId)) {
      // Module is locked, redirect to first unlocked module
      currentLessonId = undefined;
      currentModuleId = undefined;
    } else if (requestedModuleIndex >= 0) {
      // Module is unlocked, check if lesson is unlocked
      const moduleData = sortedModules[requestedModuleIndex];
      if (moduleData && moduleData.modules) {
        const sortedLessons = (moduleData.modules.module_lessons || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .filter((ml: any) => ml.lessons);

        const requestedLessonIndex = sortedLessons.findIndex((ml: any) => ml.lessons.id === currentLessonId);

        if (requestedLessonIndex > 0 && !isLessonUnlocked(currentModuleId, requestedLessonIndex, currentLessonId)) {
          // Lesson is locked, redirect to first unlocked lesson
          currentLessonId = undefined;
        }
      }
    }
  } else if (currentModuleId) {
    // Only module specified, validate it's unlocked
    const sortedModules = (course.course_modules || [])
      .filter((cm: any) => cm.modules)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);

    const requestedModuleIndex = sortedModules.findIndex((cm: any) => cm.modules.id === currentModuleId);

    if (requestedModuleIndex > 0 && !isModuleUnlocked(requestedModuleIndex, currentModuleId)) {
      // Module is locked, redirect to first unlocked module
      currentModuleId = undefined;
    }
  }

  if (!currentLessonId || !currentModuleId) {
    // Find the first incomplete unlocked lesson in the first unlocked module
    const sortedModules = (course.course_modules || [])
      .filter((cm: any) => cm.modules)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);

    for (let i = 0; i < sortedModules.length; i++) {
      const courseModule = sortedModules[i];
      const mod = courseModule.modules;
      if (!mod) continue;

      // Check if module is unlocked
      if (!isModuleUnlocked(i, mod.id)) {
        continue;
      }

      const sortedLessons = (mod.module_lessons || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .filter((ml: any) => ml.lessons);

      for (let j = 0; j < sortedLessons.length; j++) {
        const moduleLesson = sortedLessons[j];
        const lesson = moduleLesson.lessons;
        if (!lesson) continue;

        // Check if lesson is unlocked
        if (j > 0 && !isLessonUnlocked(mod.id, j, lesson.id)) {
          continue;
        }

        const progress = lessonProgress?.find((p: any) => p.lesson_id === lesson.id);

        if (!progress || (progress.status !== 'completed' && progress.status !== 'passed')) {
          currentLessonId = lesson.id;
          currentModuleId = mod.id;
          break;
        }
      }

      if (currentLessonId) break;
    }

    // If all lessons are complete, show the first lesson of the last unlocked module
    if (!currentLessonId && sortedModules.length > 0) {
      // Find the last unlocked module
      for (let i = sortedModules.length - 1; i >= 0; i--) {
        const courseModule = sortedModules[i];
        const mod = courseModule.modules;
        if (!mod) continue;

        if (isModuleUnlocked(i, mod.id)) {
          const firstLesson = mod.module_lessons?.[0]?.lessons;
          if (firstLesson) {
            currentLessonId = firstLesson.id;
            currentModuleId = mod.id;
            break;
          }
        }
      }
    }
  }

  // Determine current item type and ID
  let currentItemId = lessonId || quizId;
  let currentItemType: 'lesson' | 'quiz' | undefined = lessonId ? 'lesson' : quizId ? 'quiz' : undefined;

  // Fetch current item details
  let currentLesson = null;
  let currentQuiz = null;
  let scormUrl = '';

  if (currentItemId && currentItemType === 'lesson') {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', currentItemId)
      .single();

    currentLesson = lesson;

    // Use SCORM launch URL if available
    if (lesson?.scorm_launch_url) {
      scormUrl = lesson.scorm_launch_url;
    }
  } else if (currentItemId && currentItemType === 'quiz') {
    const { data: quiz } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions(
          id,
          question_text,
          question_type,
          image_url,
          sort_order,
          order_index,
          quiz_question_options(
            id,
            option_text,
            is_correct,
            sort_order
          )
        )
      `)
      .eq('id', currentItemId)
      .single();

    currentQuiz = quiz;
  }

  return (
    <CourseLearnClient
      course={course as any}
      currentLesson={currentLesson as any}
      currentQuiz={currentQuiz as any}
      currentItemType={currentItemType}
      currentModuleId={currentModuleId || ''}
      scormUrl={scormUrl}
      lessonProgress={lessonProgress || []}
      quizAttempts={quizAttempts || []}
      moduleProgress={moduleProgress || []}
      courseProgress={courseProgress}
      userId={user.id}
    />
  );
}

