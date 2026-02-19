import { createClient } from '@/lib/supabase/server';
import { ModuleLearnClient } from './module-learn-client';
import { notFound, redirect } from 'next/navigation';
import type { Database } from '@/types/database.types';

type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

// Enable dynamic rendering but with revalidation
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = 'force-dynamic'; // Always fetch fresh data for progress

export default async function ModuleLearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ lesson?: string; quiz?: string }>;
}) {
  const { moduleId } = await params;
  const { lesson: lessonId, quiz: quizId } = await searchParams;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Parallelize enrollment check and module fetch
  const [enrollmentResult, moduleResult] = await Promise.all([
    supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('enrollment_type', 'module')
      .eq('enrollment_id', moduleId)
      .single(),
    supabase
      .from('modules')
      .select(`
        *,
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
      `)
      .eq('id', moduleId)
      .single()
  ]);

  const { data: enrollment } = enrollmentResult;
  const { data: module, error } = moduleResult;

  if (!enrollment) {
    // Not enrolled, redirect to module details
    redirect(`/u/learning/${moduleId}`);
  }

  if (error || !module) {
    notFound();
  }

  // Extract lesson IDs and quiz IDs from module structure for filtered queries
  const lessonIds: string[] = [];
  const quizIds: string[] = [];

  module.module_lessons?.forEach((ml: any) => {
    if (ml.lessons) {
      lessonIds.push(ml.lessons.id);
    }
  });

  module.module_quizzes?.forEach((mq: any) => {
    if (mq.quizzes) {
      quizIds.push(mq.quizzes.id);
    }
  });

  // Parallelize progress queries - only fetch data for THIS module
  const [lessonProgressResult, quizAttemptsResult, moduleProgressResult] = await Promise.all([
    lessonIds.length > 0
      ? supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds)
      : Promise.resolve({ data: [] }),
    quizIds.length > 0
      ? supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .in('quiz_id', quizIds)
          .order('started_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from('module_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .single()
  ]);

  const { data: lessonProgress } = lessonProgressResult;
  const { data: quizAttempts } = quizAttemptsResult;
  const { data: moduleProgress } = moduleProgressResult;

  // Create combined content items array (lessons + quizzes)
  type ContentItem =
    | { type: 'lesson'; id: string; data: any; sort_order: number }
    | { type: 'quiz'; id: string; data: any; sort_order: number };

  const contentItems: ContentItem[] = [
    ...(module.module_lessons || []).map((ml: any) => ({
      type: 'lesson' as const,
      id: ml.lessons?.id,
      data: ml,
      sort_order: ml.sort_order,
    })),
    ...(module.module_quizzes || []).map((mq: any) => ({
      type: 'quiz' as const,
      id: mq.quizzes?.id,
      data: mq,
      sort_order: mq.sort_order,
    })),
  ]
    .filter((item) => item.id) // Remove items without valid IDs
    .sort((a, b) => a.sort_order - b.sort_order);

  // Helper function to check if a content item is completed
  const isItemCompleted = (item: ContentItem): boolean => {
    if (item.type === 'lesson') {
      const progress = lessonProgress?.find((lp: any) => lp.lesson_id === item.id);
      return progress?.status === 'completed' || progress?.status === 'passed';
    } else {
      // For quizzes, check if there's a completed attempt
      const attempts = quizAttempts?.filter((qa: any) => qa.quiz_id === item.id) || [];
      const latestAttempt = attempts[0]; // Already sorted by started_at desc
      return latestAttempt?.completed_at != null;
    }
  };

  // Helper function to check if a content item is unlocked
  const isItemUnlocked = (itemIndex: number): boolean => {
    // First item is always unlocked
    if (itemIndex === 0) return true;

    // Check if previous item is completed
    const previousItem = contentItems[itemIndex - 1];
    return isItemCompleted(previousItem);
  };

  // Determine which content item to show (lesson or quiz)
  let currentItemId: string | undefined;
  let currentItemType: 'lesson' | 'quiz' | undefined;

  // Check if a specific lesson or quiz was requested
  if (lessonId) {
    currentItemId = lessonId;
    currentItemType = 'lesson';
  } else if (quizId) {
    currentItemId = quizId;
    currentItemType = 'quiz';
  }

  // Validate that the requested item is unlocked
  if (currentItemId && currentItemType) {
    const requestedItemIndex = contentItems.findIndex(
      (item) => item.id === currentItemId && item.type === currentItemType
    );

    if (requestedItemIndex > 0 && !isItemUnlocked(requestedItemIndex)) {
      // Item is locked, reset to find first unlocked item
      currentItemId = undefined;
      currentItemType = undefined;
    }
  }

  // If no valid item selected, find the first incomplete unlocked item
  if (!currentItemId || !currentItemType) {
    for (let i = 0; i < contentItems.length; i++) {
      const item = contentItems[i];

      // Check if item is unlocked
      if (i > 0 && !isItemUnlocked(i)) {
        continue;
      }

      // Check if item is incomplete
      if (!isItemCompleted(item)) {
        currentItemId = item.id;
        currentItemType = item.type;
        break;
      }
    }

    // If all items are complete, show the first item
    if (!currentItemId && contentItems.length > 0) {
      const firstItem = contentItems[0];
      currentItemId = firstItem.id;
      currentItemType = firstItem.type;
    }
  }

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
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions(
          id,
          question_text,
          question_type,
          image_url,
          order_index,
          quiz_question_options(
            id,
            option_text,
            is_correct,
            order_index
          )
        )
      `)
      .eq('id', currentItemId)
      .single();

    if (quizError) {
      console.error('Error fetching quiz:', {
        message: quizError.message,
        code: quizError.code,
        details: quizError.details,
        hint: quizError.hint,
      });
    } else {
      console.log('Successfully fetched quiz with', quiz?.quiz_questions?.length || 0, 'questions');
    }

    currentQuiz = quiz;
  }

  console.log('Passing to client:', {
    currentItemType,
    hasCurrentLesson: !!currentLesson,
    hasCurrentQuiz: !!currentQuiz,
    currentQuizId: currentQuiz?.id,
    questionCount: currentQuiz?.quiz_questions?.length,
  });

  return (
    <ModuleLearnClient
      module={module as any}
      currentLesson={currentLesson as any}
      currentQuiz={currentQuiz as any}
      currentItemType={currentItemType}
      scormUrl={scormUrl}
      lessonProgress={lessonProgress || []}
      quizAttempts={quizAttempts || []}
      moduleProgress={moduleProgress}
      userId={user.id}
    />
  );
}


