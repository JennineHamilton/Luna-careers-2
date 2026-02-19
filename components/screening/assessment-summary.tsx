'use client';

import { LunaStatsCard } from '@/components/luna/stats-card';
import { ClipboardCheck, Target, TrendingUp } from 'lucide-react';

interface AssessmentSummaryProps {
  data: {
    typing?: any[];
    personality?: any[];
    cognitive?: any[];
    summary?: {
      total_assessments?: number;
      has_typing?: boolean;
      has_personality?: boolean;
      has_cognitive?: boolean;
    };
  };
}

export function AssessmentSummary({ data }: AssessmentSummaryProps) {
  // Calculate summary statistics
  const typingCount = data.typing?.length || 0;
  const personalityCount = data.personality?.length || 0;
  const cognitiveCount = data.cognitive?.length || 0;
  const totalAssessments = typingCount + personalityCount + cognitiveCount;

  // Calculate average score across all assessments
  let totalScore = 0;
  let scoreCount = 0;

  // Typing: use accuracy as score
  data.typing?.forEach((attempt) => {
    if (attempt.accuracy) {
      totalScore += attempt.accuracy;
      scoreCount++;
    }
  });

  // Personality: use average percentile
  data.personality?.forEach((attempt) => {
    const percentiles = [
      attempt.extraversion_percentile,
      attempt.agreeableness_percentile,
      attempt.conscientiousness_percentile,
      attempt.emotional_stability_percentile,
      attempt.intellect_percentile,
    ].filter((p) => p != null);
    
    if (percentiles.length > 0) {
      const avgPercentile = percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length;
      totalScore += avgPercentile;
      scoreCount++;
    }
  });

  // Cognitive: use overall percentile
  data.cognitive?.forEach((attempt) => {
    if (attempt.overall_percentile) {
      totalScore += attempt.overall_percentile;
      scoreCount++;
    }
  });

  const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  return (
    <div className="bg-gradient-to-br from-luna-blue/5 to-purple-50 rounded-lg p-4 shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-luna-blue rounded-lg flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-luna-gray-900">Assessment Performance</h3>
            <p className="text-xs text-luna-gray-600">System-generated report of your assessment progress</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <LunaStatsCard
            title="Assessments Completed"
            value={totalAssessments.toString()}
            icon={<Target className="w-5 h-5" />}
          />
          <LunaStatsCard
            title="Average Score"
            value={`${averageScore}%`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>
    </div>
  );
}

