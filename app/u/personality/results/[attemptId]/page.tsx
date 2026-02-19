import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PersonalityResults } from '@/components/assessment/personality-results';

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function PersonalityResultsPage({ params }: PageProps) {
  const { attemptId } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get attempt with scores
  const { data: attempt, error: attemptError } = await supabase
    .from('personality_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single();

  if (attemptError || !attempt) {
    redirect('/u/personality');
  }

  if (attempt.status === 'in_progress') {
    redirect('/u/personality/take');
  }

  // Get insights
  const { data: insights } = await supabase
    .from('personality_insights')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('confidence_level', { ascending: false });

  // Get job recommendations
  const { data: recommendations } = await supabase
    .from('personality_job_recommendations')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('match_strength', { ascending: false });

  // Transform recommendations to match expected type
  const transformedRecommendations = (recommendations || []).map(rec => ({
    ...rec,
    example_roles: Array.isArray(rec.example_roles) ? rec.example_roles as string[] : null
  }));

  return (
    <div>
      <PersonalityResults
        attempt={attempt}
        insights={insights || []}
        recommendations={transformedRecommendations}
      />
    </div>
  );
}

