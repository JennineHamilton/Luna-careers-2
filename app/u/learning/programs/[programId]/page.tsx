import { createClient } from '@/lib/supabase/server';
import { ProgramDetailsClient } from './program-details-client';
import { notFound } from 'next/navigation';
import type { Database } from '@/types/database.types';

type Program = Database['public']['Tables']['programs']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];
type Course = Database['public']['Tables']['courses']['Row'];

interface ProgramWithDetails extends Program {
  creators: Creator | null;
  program_courses: Array<{
    id: string;
    sort_order: number;
    is_required: boolean | null;
    courses: {
      id: string;
      title: string;
      description: string;
      duration_minutes: number | null;
      cover_image_url: string | null;
      level: string;
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
        } | null;
      }>;
    } | null;
  }>;
}

export default async function ProgramDetailsPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch program with creator, courses, and nested modules
  const { data: program, error } = await supabase
    .from('programs')
    .select(`
      *,
      creators(id, name, logo_url, bio, verified),
      program_courses(
        id,
        sort_order,
        is_required,
        courses(
          id,
          title,
          description,
          duration_minutes,
          cover_image_url,
          level,
          course_modules(
            id,
            sort_order,
            is_required,
            modules(id, title, description, duration_minutes, cover_image_url, level)
          )
        )
      )
    `)
    .eq('id', programId)
    .eq('is_published', true)
    .single();

  if (error || !program) {
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

  // Convert program skills to names
  const programSkillNames = convertSkillsToNames(program.skills);

  // Fetch user's program progress if logged in
  let programProgress = null;
  let courseProgress: any[] = [];
  let moduleProgress: any[] = [];
  let enrollment = null;
  let creditBalance = 0;
  let awardedScholarship = null;

  if (user) {
    // Check if user is enrolled
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('enrollment_type', 'program')
      .eq('enrollment_id', programId)
      .single();

    enrollment = enrollmentData;

    // Fetch credit balance
    const { data: wallet } = await supabase
      .from('credit_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    creditBalance = wallet?.balance || 0;

    const { data: progress } = await supabase
      .from('program_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('program_id', programId)
      .single();

    programProgress = progress;

    // Fetch course progress
    const courseIds = program.program_courses.map((pc: any) => pc.courses.id);
    if (courseIds.length > 0) {
      const { data: courses } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('course_id', courseIds);

      courseProgress = courses || [];
    }

    // Fetch module progress
    const moduleIds: string[] = [];
    program.program_courses.forEach((pc: any) => {
      pc.courses.course_modules?.forEach((cm: any) => {
        moduleIds.push(cm.modules.id);
      });
    });

    if (moduleIds.length > 0) {
      const { data: modules } = await supabase
        .from('module_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('module_id', moduleIds);

      moduleProgress = modules || [];
    }

    // Fetch awarded scholarship for this program
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
      .eq('content_type', 'program')
      .eq('content_id', programId)
      .eq('used', false)
      .maybeSingle();

    awardedScholarship = scholarship;
  }

  return (
    <ProgramDetailsClient
      program={program as ProgramWithDetails}
      programProgress={programProgress}
      courseProgress={courseProgress}
      moduleProgress={moduleProgress}
      userId={user?.id}
      enrollment={enrollment}
      creditBalance={creditBalance}
      awardedScholarship={awardedScholarship}
      skillNames={programSkillNames}
    />
  );
}

