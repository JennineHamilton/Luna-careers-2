import { createClient } from '@/lib/supabase/server';
import { ProgramLearnClient } from './program-learn-client';
import { notFound, redirect } from 'next/navigation';
import type { Database } from '@/types/database.types';

type Program = Database['public']['Tables']['programs']['Row'];
type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

// Enable dynamic rendering but with revalidation
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = 'force-dynamic'; // Always fetch fresh data for progress

export default async function ProgramLearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string }>;
  searchParams: Promise<{ lesson?: string; module?: string; course?: string; quiz?: string }>;
}) {
  const { programId } = await params;
  const { lesson: lessonId, module: moduleId, course: courseId, quiz: quizId } = await searchParams;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Parallelize enrollment check and program fetch
  const [enrollmentResult, programResult] = await Promise.all([
    supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('enrollment_type', 'program')
      .eq('enrollment_id', programId)
      .single(),
    supabase
      .from('programs')
      .select(`
        *,
        program_courses(
          id,
          sort_order,
          is_required,
          courses(
            id,
            title,
            description,
            cover_image_url,
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
          )
        )
      `)
      .eq('id', programId)
      .single()
  ]);

  const { data: enrollment } = enrollmentResult;
  const { data: program, error } = programResult;

  if (!enrollment) {
    // Not enrolled, redirect to program details
    redirect(`/u/learning/programs/${programId}`);
  }

  if (error || !program) {
    notFound();
  }

  // Extract lesson, module, course, and quiz IDs from program structure for filtered queries
  const lessonIds: string[] = [];
  const moduleIds: string[] = [];
  const courseIds: string[] = [];
  const quizIds: string[] = [];

  program.program_courses?.forEach((pc: any) => {
    if (pc.courses) {
      courseIds.push(pc.courses.id);
      pc.courses.course_modules?.forEach((cm: any) => {
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
    }
  });

  // Parallelize progress queries - only fetch data for THIS program
  const [lessonProgressResult, moduleProgressResult, courseProgressResult, programProgressResult, quizAttemptsResult] = await Promise.all([
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
    courseIds.length > 0
      ? supabase
          .from('course_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('course_id', courseIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('program_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('program_id', programId)
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
  const { data: programProgress } = programProgressResult;
  const { data: quizAttempts } = quizAttemptsResult;

  // Helper function to check if a course is unlocked
  const isCourseUnlocked = (courseIndex: number, courseId: string): boolean => {
    // First course is always unlocked
    if (courseIndex === 0) return true;

    // Check if previous course is completed
    const sortedCourses = (program.program_courses || [])
      .filter((pc: any) => pc.courses)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);

    if (courseIndex > 0) {
      const previousCourse = sortedCourses[courseIndex - 1]?.courses;
      if (previousCourse) {
        const previousCourseProgress = courseProgress?.find((cp: any) => cp.course_id === previousCourse.id);
        return previousCourseProgress?.status === 'completed';
      }
    }

    return false;
  };

  // Helper function to check if a module is unlocked within a course
  const isModuleUnlocked = (courseId: string, moduleIndex: number, moduleId: string): boolean => {
    // First module is always unlocked
    if (moduleIndex === 0) return true;

    // Find the course
    const courseData = (program.program_courses || [])
      .filter((pc: any) => pc.courses)
      .find((pc: any) => pc.courses.id === courseId);

    if (!courseData || !courseData.courses) return false;

    const sortedModules = (courseData.courses.course_modules || [])
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

    // Find the module across all courses
    let moduleData: any = null;
    for (const pc of (program.program_courses || [])) {
      if (!pc.courses) continue;
      const found = (pc.courses.course_modules || [])
        .filter((cm: any) => cm.modules)
        .find((cm: any) => cm.modules.id === moduleId);
      if (found) {
        moduleData = found;
        break;
      }
    }

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
  let currentCourseId: string | undefined = courseId;

  // Validate that the requested course, module, and lesson are unlocked
  if (currentCourseId && currentModuleId && currentLessonId) {
    const sortedCourses = (program.program_courses || [])
      .filter((pc: any) => pc.courses)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);

    const requestedCourseIndex = sortedCourses.findIndex((pc: any) => pc.courses.id === currentCourseId);

    // Check if course is unlocked
    if (requestedCourseIndex > 0 && !isCourseUnlocked(requestedCourseIndex, currentCourseId)) {
      currentLessonId = undefined;
      currentModuleId = undefined;
      currentCourseId = undefined;
    } else if (requestedCourseIndex >= 0) {
      // Course is unlocked, check if module is unlocked
      const courseData = sortedCourses[requestedCourseIndex];
      if (courseData && courseData.courses) {
        const sortedModules = (courseData.courses.course_modules || [])
          .filter((cm: any) => cm.modules)
          .sort((a: any, b: any) => a.sort_order - b.sort_order);

        const requestedModuleIndex = sortedModules.findIndex((cm: any) => cm.modules.id === currentModuleId);

        if (requestedModuleIndex > 0 && !isModuleUnlocked(currentCourseId, requestedModuleIndex, currentModuleId)) {
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
              currentLessonId = undefined;
            }
          }
        }
      }
    }
  }

  if (!currentLessonId || !currentModuleId || !currentCourseId) {
    // Find the first incomplete unlocked lesson in the first unlocked module in the first unlocked course
    const sortedCourses = (program.program_courses || [])
      .filter((pc: any) => pc.courses)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);

    for (let i = 0; i < sortedCourses.length; i++) {
      const programCourse = sortedCourses[i];
      const course = programCourse.courses;
      if (!course) continue;

      // Check if course is unlocked
      if (!isCourseUnlocked(i, course.id)) {
        continue;
      }

      const sortedModules = (course.course_modules || [])
        .filter((cm: any) => cm.modules)
        .sort((a: any, b: any) => a.sort_order - b.sort_order);

      for (let j = 0; j < sortedModules.length; j++) {
        const courseModule = sortedModules[j];
        const mod = courseModule.modules;
        if (!mod) continue;

        // Check if module is unlocked
        if (!isModuleUnlocked(course.id, j, mod.id)) {
          continue;
        }

        const sortedLessons = (mod.module_lessons || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .filter((ml: any) => ml.lessons);

        for (let k = 0; k < sortedLessons.length; k++) {
          const moduleLesson = sortedLessons[k];
          const lesson = moduleLesson.lessons;
          if (!lesson) continue;

          // Check if lesson is unlocked
          if (k > 0 && !isLessonUnlocked(mod.id, k, lesson.id)) {
            continue;
          }

          const progress = lessonProgress?.find((p: any) => p.lesson_id === lesson.id);

          if (!progress || (progress.status !== 'completed' && progress.status !== 'passed')) {
            currentLessonId = lesson.id;
            currentModuleId = mod.id;
            currentCourseId = course.id;
            break;
          }
        }

        if (currentLessonId) break;
      }

      if (currentLessonId) break;
    }

    // If all lessons are complete, show the first lesson of the last unlocked module in the last unlocked course
    if (!currentLessonId && sortedCourses.length > 0) {
      for (let i = sortedCourses.length - 1; i >= 0; i--) {
        const programCourse = sortedCourses[i];
        const course = programCourse.courses;
        if (!course) continue;

        if (isCourseUnlocked(i, course.id)) {
          const sortedModules = (course.course_modules || [])
            .filter((cm: any) => cm.modules)
            .sort((a: any, b: any) => a.sort_order - b.sort_order);

          for (let j = sortedModules.length - 1; j >= 0; j--) {
            const courseModule = sortedModules[j];
            const mod = courseModule.modules;
            if (!mod) continue;

            if (isModuleUnlocked(course.id, j, mod.id)) {
              const firstLesson = mod.module_lessons?.[0]?.lessons;
              if (firstLesson) {
                currentLessonId = firstLesson.id;
                currentModuleId = mod.id;
                currentCourseId = course.id;
                break;
              }
            }
          }

          if (currentLessonId) break;
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
    <ProgramLearnClient
      program={program as any}
      currentLesson={currentLesson as any}
      currentQuiz={currentQuiz as any}
      currentItemType={currentItemType}
      currentModuleId={currentModuleId || ''}
      currentCourseId={currentCourseId || ''}
      scormUrl={scormUrl}
      lessonProgress={lessonProgress || []}
      quizAttempts={quizAttempts || []}
      moduleProgress={moduleProgress || []}
      courseProgress={courseProgress || []}
      programProgress={programProgress}
      userId={user.id}
    />
  );
}



