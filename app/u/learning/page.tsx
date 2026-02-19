import { createClient } from '@/lib/supabase/server';
import { LearningPageClient } from './learning-client';
import type { Database } from '@/types/database.types';

type Module = Database['public']['Tables']['modules']['Row'];
type Course = Database['public']['Tables']['courses']['Row'];
type Program = Database['public']['Tables']['programs']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

interface ModuleWithCreator extends Module {
  creators: Creator | null;
}

interface CourseWithCreator extends Course {
  creators: Creator | null;
}

interface ProgramWithCreator extends Program {
  creators: Creator | null;
}

export default async function LearningPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

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

  // Fetch published modules with creator info
  const { data: modulesRaw } = await supabase
    .from('modules')
    .select('*, creators(id, name, logo_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  // Convert skills UUIDs to names for modules
  const modules = (modulesRaw || []).map(module => ({
    ...module,
    skills: convertSkillsToNames(module.skills)
  }));

  // Fetch published courses with creator info
  const { data: coursesRaw } = await supabase
    .from('courses')
    .select('*, creators(id, name, logo_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  // Convert skills UUIDs to names for courses
  const courses = (coursesRaw || []).map(course => ({
    ...course,
    skills: convertSkillsToNames(course.skills)
  }));

  // Fetch published programs with creator info
  const { data: programsRaw } = await supabase
    .from('programs')
    .select('*, creators(id, name, logo_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  // Convert skills UUIDs to names for programs
  const programs = (programsRaw || []).map(program => ({
    ...program,
    skills: convertSkillsToNames(program.skills)
  }));

  // Fetch user's progress if logged in
  let moduleProgress: any[] = [];
  let courseProgress: any[] = [];
  let programProgress: any[] = [];
  let scholarshipApplications: any[] = [];
  let userBalance = 0;

  if (user) {
    // Fetch module progress
    const { data: modProgress } = await supabase
      .from('module_progress')
      .select('*')
      .eq('user_id', user.id);

    moduleProgress = modProgress || [];

    // Fetch course progress
    const { data: courProgress } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id);

    courseProgress = courProgress || [];

    // Fetch program progress
    const { data: progProgress } = await supabase
      .from('program_progress')
      .select('*')
      .eq('user_id', user.id);

    programProgress = progProgress || [];

    // Fetch user's pending scholarship applications
    const { data: applications } = await supabase
      .from('scholarship_applications')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    scholarshipApplications = applications || [];

    // Fetch user's credit balance
    const { data: wallet } = await supabase
      .from('credit_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    userBalance = wallet?.balance || 0;
  }

  return (
    <LearningPageClient
      modules={modules as any[] || []}
      courses={courses as any[] || []}
      programs={programs as any[] || []}
      moduleProgress={moduleProgress}
      courseProgress={courseProgress}
      programProgress={programProgress}
      scholarshipApplications={scholarshipApplications}
      userId={user?.id}
      userBalance={userBalance}
    />
  );
}

