import { createClient } from '@/lib/supabase/server';
import { LessonPlayerClient } from './lesson-player-client';
import { notFound, redirect } from 'next/navigation';
import type { Database } from '@/types/database.types';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ moduleId: string; lessonId: string }>;
}) {
  const { moduleId, lessonId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is enrolled in the module
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('enrollment_type', 'module')
    .eq('enrollment_id', moduleId)
    .single();

  if (!enrollment) {
    // Not enrolled, redirect to module details
    redirect(`/u/learning/${moduleId}`);
  }

  // Fetch lesson details
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  if (lessonError || !lesson) {
    notFound();
  }

  // Fetch module details
  const { data: module } = await supabase
    .from('modules')
    .select('id, title')
    .eq('id', moduleId)
    .single();

  // Fetch lesson progress
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single();

  // Get SCORM package URL from Supabase Storage
  let scormUrl = '';
  if (lesson.scorm_package_url) {
    const { data } = supabase.storage
      .from('scorm-packages')
      .getPublicUrl(lesson.scorm_package_url);
    scormUrl = data.publicUrl;
  }

  // Fetch all lessons in this module for navigation
  const { data: moduleLessons } = await supabase
    .from('module_lessons')
    .select(`
      lesson_id,
      sort_order,
      lessons(id, title)
    `)
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true });

  const sortedLessons = moduleLessons || [];
  const currentIndex = sortedLessons.findIndex((ml: any) => ml.lesson_id === lessonId);
  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;

  return (
    <LessonPlayerClient
      lesson={lesson as Lesson}
      module={module as Module}
      scormUrl={scormUrl}
      lessonProgress={lessonProgress}
      userId={user.id}
      moduleId={moduleId}
      previousLesson={previousLesson}
      nextLesson={nextLesson}
    />
  );
}

