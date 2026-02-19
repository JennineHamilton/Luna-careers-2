'use client';

import { LunaAccordionItem, LunaAccordionTrigger, LunaAccordionContent } from '@/components/luna/accordion';
import { LunaStatsCard } from '@/components/luna/stats-card';
import { LunaBadge } from '@/components/luna/badge';
import { LunaChart } from '@/components/luna/chart';
import { Brain, TrendingUp } from 'lucide-react';

interface PersonalityAssessmentReportProps {
  attempt: {
    id: string;
    extraversion_percentile: number;
    agreeableness_percentile: number;
    conscientiousness_percentile: number;
    emotional_stability_percentile: number;
    intellect_percentile: number;
  };
}

export function PersonalityAssessmentReport({ attempt }: PersonalityAssessmentReportProps) {
  // Calculate average percentile
  const percentiles = [
    attempt.extraversion_percentile,
    attempt.agreeableness_percentile,
    attempt.conscientiousness_percentile,
    attempt.emotional_stability_percentile,
    attempt.intellect_percentile,
  ];
  const averagePercentile = Math.round(percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length);

  // Get top 2 traits
  const traits = [
    { name: 'Extraversion', percentile: attempt.extraversion_percentile },
    { name: 'Agreeableness', percentile: attempt.agreeableness_percentile },
    { name: 'Conscientiousness', percentile: attempt.conscientiousness_percentile },
    { name: 'Emotional Stability', percentile: attempt.emotional_stability_percentile },
    { name: 'Intellect', percentile: attempt.intellect_percentile },
  ].sort((a, b) => b.percentile - a.percentile);

  const topTraits = traits.slice(0, 2);

  // Prepare radar chart data
  const radarData = [
    { trait: 'Extraversion', score: attempt.extraversion_percentile },
    { trait: 'Agreeableness', score: attempt.agreeableness_percentile },
    { trait: 'Conscientiousness', score: attempt.conscientiousness_percentile },
    { trait: 'Emotional Stability', score: attempt.emotional_stability_percentile },
    { trait: 'Intellect', score: attempt.intellect_percentile },
  ];

  // Get work style summary based on top traits
  const getWorkStyleSummary = () => {
    const topTrait = topTraits[0].name;
    if (topTrait === 'Conscientiousness') {
      return "Highly organized and detail-oriented. Excels in structured environments with clear goals and deadlines.";
    } else if (topTrait === 'Extraversion') {
      return "Energetic and sociable. Thrives in collaborative team settings and client-facing roles.";
    } else if (topTrait === 'Agreeableness') {
      return "Cooperative and empathetic. Strong team player who builds positive relationships.";
    } else if (topTrait === 'Emotional Stability') {
      return "Calm and resilient under pressure. Maintains composure in high-stress situations.";
    } else {
      return "Curious and analytical. Enjoys problem-solving and learning new concepts.";
    }
  };

  return (
    <LunaAccordionItem value={attempt.id} className="bg-white rounded-lg px-4 py-1 shadow-none">
      <LunaAccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-luna-gray-900">Personality Assessment</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                {topTraits.map((trait, index) => (
                  <LunaBadge key={index} variant="primary" size="sm">
                    {trait.name}
                  </LunaBadge>
                ))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-luna-gray-900">{averagePercentile}%</div>
            <div className="text-[10px] text-luna-gray-500">Avg Percentile</div>
          </div>
        </div>
      </LunaAccordionTrigger>

      <LunaAccordionContent>
        <div className="space-y-4 pt-3">
          {/* Big Five Percentile Bars */}
          <div>
            <h5 className="text-xs font-semibold text-luna-gray-900 mb-2">Big Five Personality Dimensions</h5>
            <div className="space-y-2">
              {traits.map((trait) => (
                <div key={trait.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-luna-gray-700">{trait.name}</span>
                    <span className="text-xs font-semibold text-luna-gray-900">{trait.percentile}%</span>
                  </div>
                  <div className="w-full bg-luna-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${trait.percentile}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Work Style Summary */}
          <div className="bg-purple-50 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-purple-900 mb-1.5">Work Style Summary</h5>
            <p className="text-xs text-purple-800 leading-relaxed">
              {getWorkStyleSummary()}
            </p>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-luna-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-luna-gray-900 mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-luna-success" />
                Top Strengths
              </h5>
              <ul className="text-xs text-luna-gray-700 space-y-0.5">
                {topTraits.map((trait, index) => (
                  <li key={index}>• {trait.name} ({trait.percentile}th percentile)</li>
                ))}
              </ul>
            </div>

            <div className="bg-luna-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-luna-gray-900 mb-1.5">Ideal Work Environment</h5>
              <p className="text-xs text-luna-gray-700 leading-relaxed">
                {topTraits[0].name === 'Conscientiousness' && "Structured, goal-oriented settings with clear expectations"}
                {topTraits[0].name === 'Extraversion' && "Collaborative, dynamic environments with social interaction"}
                {topTraits[0].name === 'Agreeableness' && "Team-based, supportive cultures with emphasis on cooperation"}
                {topTraits[0].name === 'Emotional Stability' && "Fast-paced, high-pressure roles requiring composure"}
                {topTraits[0].name === 'Intellect' && "Innovative, learning-focused environments with complex challenges"}
              </p>
            </div>
          </div>

        </div>
      </LunaAccordionContent>
    </LunaAccordionItem>
  );
}

