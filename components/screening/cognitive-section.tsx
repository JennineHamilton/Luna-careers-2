'use client';

import { useState, useEffect } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';
import { Loader2 } from 'lucide-react';
import { CognitiveReport } from './cognitive-report';
import { createClient } from '@/lib/supabase/client';

interface CognitiveSectionProps {
  data: any;
}

export function CognitiveSection({ data }: CognitiveSectionProps) {
  const [loading, setLoading] = useState(true);
  const [cognitiveAttempt, setCognitiveAttempt] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchCognitiveAttempt();
  }, []);

  const fetchCognitiveAttempt = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch completed cognitive attempt with insights
      const { data: attempt, error } = await supabase
        .from('cognitive_attempts')
        .select(`
          *,
          cognitive_insights (
            insight_type,
            category,
            title,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching cognitive attempt:', error);
        return;
      }

      setCognitiveAttempt(attempt);
    } catch (error) {
      console.error('Error in fetchCognitiveAttempt:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-luna-gray-400" />
      </div>
    );
  }

  // If no attempt, don't show anything (user takes test from /u/screening page)
  if (!cognitiveAttempt) {
    return null;
  }

  // If attempt exists, show report
  return (
    <CognitiveReport
      attempt={cognitiveAttempt}
      onViewDetails={() => {
        // TODO: Open detailed results modal
        console.log('View detailed results');
      }}
    />
  );
}

