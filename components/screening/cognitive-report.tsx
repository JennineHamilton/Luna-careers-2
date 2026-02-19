'use client';

import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';
import { LunaProgress } from '@/components/luna/progress';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { Brain, BookOpen, Calculator, Grid3x3, Eye, ChevronRight, TrendingUp } from 'lucide-react';

interface CognitiveInsight {
  insight_type: string;
  category: string;
  title: string;
  description: string;
}

interface CognitiveAttempt {
  id: string;
  status: string;
  started_at: string;
  completed_at: string;
  overall_score: number;
  overall_percentile: number;
  verbal_score: number;
  verbal_percentile: number;
  numerical_score: number;
  numerical_percentile: number;
  abstract_score: number;
  abstract_percentile: number;
  attention_score: number;
  attention_percentile: number;
  cognitive_insights: CognitiveInsight[];
}

interface CognitiveReportProps {
  attempt: CognitiveAttempt;
  onViewDetails?: () => void;
}

const domainConfig = {
  verbal: {
    name: 'Verbal Reasoning',
    icon: BookOpen,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Language comprehension and reasoning',
  },
  numerical: {
    name: 'Numerical Reasoning',
    icon: Calculator,
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    description: 'Mathematical and quantitative thinking',
  },
  abstract: {
    name: 'Abstract Reasoning',
    icon: Grid3x3,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    description: 'Pattern recognition and logical thinking',
  },
  attention: {
    name: 'Attention to Detail',
    icon: Eye,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    description: 'Focus and accuracy',
  },
};

function getPerformanceLevel(percentile: number): {
  level: string;
  color: 'success' | 'warning' | 'error' | 'default';
  description: string;
} {
  if (percentile >= 80) {
    return {
      level: 'Exceptional',
      color: 'success',
      description: 'Outstanding cognitive abilities',
    };
  } else if (percentile >= 60) {
    return {
      level: 'Above Average',
      color: 'success',
      description: 'Strong cognitive performance',
    };
  } else if (percentile >= 40) {
    return {
      level: 'Average',
      color: 'default',
      description: 'Solid cognitive abilities',
    };
  } else {
    return {
      level: 'Developing',
      color: 'warning',
      description: 'Room for growth',
    };
  }
}

function getPercentileLabel(percentile: number): string {
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Above Average';
  if (percentile >= 25) return 'Average';
  return 'Below Average';
}

export function CognitiveReport({ attempt, onViewDetails }: CognitiveReportProps) {
  const performance = getPerformanceLevel(attempt.overall_percentile);
  
  // Get insights by type
  const strengths = attempt.cognitive_insights?.filter(i => i.insight_type === 'strength') || [];
  const weaknesses = attempt.cognitive_insights?.filter(i => i.insight_type === 'weakness') || [];
  const recommendations = attempt.cognitive_insights?.filter(i => i.insight_type === 'recommendation') || [];

  const domains = [
    { key: 'verbal', score: attempt.verbal_score, percentile: attempt.verbal_percentile },
    { key: 'numerical', score: attempt.numerical_score, percentile: attempt.numerical_percentile },
    { key: 'abstract', score: attempt.abstract_score, percentile: attempt.abstract_percentile },
    { key: 'attention', score: attempt.attention_score, percentile: attempt.attention_percentile },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <LunaCard>
        <LunaCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <LunaCardTitle>Cognitive Abilities</LunaCardTitle>
                <p className="text-sm text-luna-gray-600">
                  ICAR Assessment • Completed {new Date(attempt.completed_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <LunaBadge variant={performance.color} size="lg">
              {performance.level}
            </LunaBadge>
          </div>
        </LunaCardHeader>
        <LunaCardContent>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-luna-gray-600 mb-1">Overall Cognitive Score</p>
                <p className="text-4xl font-bold text-purple-600">{attempt.overall_score}/100</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-luna-gray-600 mb-1">Percentile Rank</p>
                <p className="text-3xl font-bold text-luna-gray-900">{attempt.overall_percentile}th</p>
                <p className="text-xs text-luna-gray-500 mt-1">
                  {getPercentileLabel(attempt.overall_percentile)}
                </p>
              </div>
            </div>
          </div>

          {/* Domain Scores Grid */}
          <div className="grid grid-cols-2 gap-4">
            {domains.map(({ key, score, percentile }) => {
              const config = domainConfig[key as keyof typeof domainConfig];
              const Icon = config.icon;

              return (
                <div
                  key={key}
                  className={`p-4 ${config.lightColor} border ${config.borderColor} rounded-lg`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`h-4 w-4 ${config.textColor}`} />
                    <h4 className={`text-sm font-semibold ${config.textColor}`}>
                      {config.name}
                    </h4>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-luna-gray-900">{score}</span>
                    <span className="text-sm text-luna-gray-600">/100</span>
                    <span className="text-sm text-luna-gray-500 ml-auto">
                      {percentile}th percentile
                    </span>
                  </div>
                  <LunaProgress value={score} variant="default" size="sm" />
                </div>
              );
            })}
          </div>
        </LunaCardContent>
      </LunaCard>

      {/* Key Insights */}
      {(strengths.length > 0 || weaknesses.length > 0 || recommendations.length > 0) && (
        <LunaCard>
          <LunaCardHeader>
            <LunaCardTitle>Key Insights</LunaCardTitle>
          </LunaCardHeader>
          <LunaCardContent className="space-y-3">
            {/* Strengths */}
            {strengths.slice(0, 2).map((insight, index) => (
              <div
                key={`strength-${index}`}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <LunaBadge variant="success" size="sm">Strength</LunaBadge>
                      <h4 className="text-sm font-semibold text-green-900">{insight.title}</h4>
                    </div>
                    <p className="text-sm text-green-700">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Development Areas */}
            {weaknesses.slice(0, 1).map((insight, index) => (
              <div
                key={`weakness-${index}`}
                className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <LunaBadge variant="warning" size="sm">Development Area</LunaBadge>
                      <h4 className="text-sm font-semibold text-amber-900">{insight.title}</h4>
                    </div>
                    <p className="text-sm text-amber-700">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Recommendations */}
            {recommendations.slice(0, 1).map((insight, index) => (
              <div
                key={`recommendation-${index}`}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <LunaBadge variant="default" size="sm">Recommendation</LunaBadge>
                      <h4 className="text-sm font-semibold text-blue-900">{insight.title}</h4>
                    </div>
                    <p className="text-sm text-blue-700">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </LunaCardContent>
        </LunaCard>
      )}

      {/* View Detailed Results Button */}
      {onViewDetails && (
        <LunaCard>
          <LunaCardContent className="pt-6">
            <LunaButton
              variant="outline"
              onClick={onViewDetails}
              className="w-full"
            >
              View Detailed Results
              <ChevronRight className="h-4 w-4 ml-2" />
            </LunaButton>
          </LunaCardContent>
        </LunaCard>
      )}
    </div>
  );
}

