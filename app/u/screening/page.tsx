import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScreeningClient } from './screening-client';

export const metadata = {
  title: 'Skills Assessment | Luna Careers',
  description: 'Take typing assessments to showcase your skills to employers',
};

export default async function ScreeningPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch active typing assessments
  const { data: assessments, error: assessmentsError } = await supabase
    .from('assessment_templates')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (assessmentsError) {
    console.error('Error fetching assessments:', assessmentsError);
  }

  // Fetch active knowledge assessments
  const { data: knowledgeAssessments, error: knowledgeError } = await supabase
    .from('knowledge_assessments')
    .select('*')
    .eq('is_active', true)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (knowledgeError) {
    console.error('Error fetching knowledge assessments:', knowledgeError);
  }

  // Fetch user's knowledge attempts that are on their profile with scores
  const { data: knowledgeAttempts, error: knowledgeAttemptsError } = await supabase
    .from('knowledge_attempts')
    .select('id, assessment_id, score_percentage, passed')
    .eq('user_id', user.id)
    .eq('display_on_profile', true);

  if (knowledgeAttemptsError) {
    console.error('Error fetching knowledge attempts:', knowledgeAttemptsError);
  }

  // Group knowledge attempts by assessment with scores
  const knowledgeAttemptsByAssessment: Record<string, { id: string; score: number; passed: boolean }> = {};
  if (knowledgeAttempts) {
    knowledgeAttempts.forEach((attempt) => {
      knowledgeAttemptsByAssessment[attempt.assessment_id] = {
        id: attempt.id,
        score: attempt.score_percentage || 0,
        passed: attempt.passed || false,
      };
    });
  }

  // Fetch user's badges
  const { data: badges, error: badgesError } = await supabase
    .from('user_skill_badges')
    .select(`
      *,
      assessment_template:assessment_templates (*)
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false });

  if (badgesError) {
    console.error('Error fetching badges:', badgesError);
  }

  // Fetch user's attempts (to show previous attempts count)
  const { data: attempts, error: attemptsError } = await supabase
    .from('assessment_attempts')
    .select('assessment_template_id, id')
    .eq('user_id', user.id);

  if (attemptsError) {
    console.error('Error fetching attempts:', attemptsError);
  }

  // Group attempts by assessment
  const attemptsByAssessment: Record<string, number> = {};
  if (attempts) {
    attempts.forEach((attempt) => {
      const key = attempt.assessment_template_id;
      attemptsByAssessment[key] = (attemptsByAssessment[key] || 0) + 1;
    });
  }

  // Fetch user's personality assessment attempts with scores
  const { data: personalityAttempts, error: personalityAttemptsError } = await supabase
    .from('personality_attempts')
    .select('id, assessment_template_id, extraversion_score, agreeableness_score, conscientiousness_score, emotional_stability_score, intellect_score, completed_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  if (personalityAttemptsError) {
    console.error('Error fetching personality attempts:', personalityAttemptsError);
  }

  // Group personality attempts by assessment (take the most recent)
  const personalityAttemptsByAssessment: Record<string, { id: string; averageScore: number }> = {};
  if (personalityAttempts) {
    personalityAttempts.forEach((attempt) => {
      if (attempt.assessment_template_id && !personalityAttemptsByAssessment[attempt.assessment_template_id]) {
        // Calculate average of Big Five scores
        const scores = [
          attempt.extraversion_score,
          attempt.agreeableness_score,
          attempt.conscientiousness_score,
          attempt.emotional_stability_score,
          attempt.intellect_score,
        ].filter((s): s is number => s !== null);

        const averageScore = scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0;

        personalityAttemptsByAssessment[attempt.assessment_template_id] = {
          id: attempt.id,
          averageScore: Math.round(averageScore),
        };
      }
    });
  }

  // Fetch user's cognitive assessment attempts with scores
  const { data: cognitiveAttempts, error: cognitiveAttemptsError } = await supabase
    .from('cognitive_attempts')
    .select('id, template_id, overall_raw_score, overall_percentile, completed_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  if (cognitiveAttemptsError) {
    console.error('Error fetching cognitive attempts:', cognitiveAttemptsError);
  }

  // Map cognitive attempts by template_id (take the most recent)
  const cognitiveAttemptsByTemplate: Record<string, { id: string; score: number; percentile: number }> = {};
  if (cognitiveAttempts) {
    cognitiveAttempts.forEach((attempt) => {
      if (attempt.template_id && !cognitiveAttemptsByTemplate[attempt.template_id]) {
        cognitiveAttemptsByTemplate[attempt.template_id] = {
          id: attempt.id,
          score: attempt.overall_raw_score || 0,
          percentile: attempt.overall_percentile || 0,
        };
      }
    });
  }

  // Map cognitive template IDs to assessment template IDs
  const { data: cognitiveTemplateMapping, error: cognitiveTemplateMappingError } = await supabase
    .from('assessment_templates')
    .select('id')
    .eq('category', 'cognitive')
    .eq('is_active', true)
    .single();

  if (cognitiveTemplateMappingError) {
    console.error('Error fetching cognitive template mapping:', cognitiveTemplateMappingError);
  }

  // Create a mapping for cognitive assessments
  const cognitiveAttemptsByAssessment: Record<string, { id: string; score: number; percentile: number }> = {};
  if (cognitiveTemplateMapping && cognitiveAttempts) {
    // For now, we'll use the first cognitive attempt for the cognitive assessment template
    const firstAttempt = cognitiveAttempts[0];
    if (firstAttempt) {
      cognitiveAttemptsByAssessment[cognitiveTemplateMapping.id] = {
        id: firstAttempt.id,
        score: firstAttempt.overall_raw_score || 0,
        percentile: firstAttempt.overall_percentile || 0,
      };
    }
  }

  return (
    <ScreeningClient
      assessments={assessments || []}
      knowledgeAssessments={knowledgeAssessments || []}
      badges={badges || []}
      attemptsByAssessment={attemptsByAssessment}
      knowledgeAttemptsByAssessment={knowledgeAttemptsByAssessment}
      personalityAttemptsByAssessment={personalityAttemptsByAssessment}
      cognitiveAttemptsByAssessment={cognitiveAttemptsByAssessment}
    />
  );
}

