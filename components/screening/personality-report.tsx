'use client';

import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';
import { LunaProgress } from '@/components/luna/progress';
import { LunaBadge } from '@/components/luna/badge';
import { Users, Heart, Target, Shield, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

interface PersonalityInsight {
  insight_type: string;
  category: string;
  title: string;
  description: string;
  confidence_level: string;
}

interface PersonalityAttempt {
  id: string;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  extraversion_score: number | null;
  agreeableness_score: number | null;
  conscientiousness_score: number | null;
  emotional_stability_score: number | null;
  intellect_score: number | null;
  extraversion_percentile: number | null;
  agreeableness_percentile: number | null;
  conscientiousness_percentile: number | null;
  emotional_stability_percentile: number | null;
  intellect_percentile: number | null;
  personality_insights: PersonalityInsight[];
}

interface PersonalityReportProps {
  attempt: PersonalityAttempt;
}

const dimensionConfig = {
  extraversion: {
    name: 'Extraversion',
    icon: Users,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    description: 'Social energy and assertiveness',
  },
  agreeableness: {
    name: 'Agreeableness',
    icon: Heart,
    color: 'bg-pink-500',
    lightColor: 'bg-pink-100',
    textColor: 'text-pink-700',
    description: 'Cooperation and empathy',
  },
  conscientiousness: {
    name: 'Conscientiousness',
    icon: Target,
    color: 'bg-green-500',
    lightColor: 'bg-green-100',
    textColor: 'text-green-700',
    description: 'Organization and dependability',
  },
  emotional_stability: {
    name: 'Emotional Stability',
    icon: Shield,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    description: 'Stress tolerance and resilience',
  },
  intellect: {
    name: 'Openness to Experience',
    icon: Lightbulb,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    description: 'Creativity and curiosity',
  },
};

function getPercentileLabel(percentile: number): string {
  if (percentile >= 80) return 'Very High';
  if (percentile >= 60) return 'High';
  if (percentile >= 40) return 'Moderate';
  if (percentile >= 20) return 'Low';
  return 'Very Low';
}

function getPercentileDescription(dimension: string, percentile: number): string {
  const level = getPercentileLabel(percentile);
  
  const descriptions: Record<string, Record<string, string>> = {
    extraversion: {
      'Very High': 'You thrive in social settings and enjoy being the center of attention. You energize groups and build connections easily.',
      'High': 'You enjoy social interactions and feel comfortable in group settings. You balance social time with some alone time.',
      'Moderate': 'You adapt well to both social and solitary situations. You can be outgoing when needed but also value quiet time.',
      'Low': 'You prefer smaller groups and meaningful one-on-one conversations. You recharge through quiet reflection.',
      'Very Low': 'You strongly prefer solitude and find large social gatherings draining. You excel in independent work.',
    },
    agreeableness: {
      'Very High': 'You are exceptionally compassionate and always put others first. You excel at building harmony and trust.',
      'High': 'You are considerate and cooperative. You value relationships and work well in team environments.',
      'Moderate': 'You balance being helpful with standing your ground. You can be both cooperative and assertive when needed.',
      'Low': 'You are direct and objective. You prioritize results and aren\'t afraid to challenge ideas.',
      'Very Low': 'You are highly competitive and results-focused. You excel in roles requiring tough decisions.',
    },
    conscientiousness: {
      'Very High': 'You are extremely organized and detail-oriented. You set high standards and always follow through on commitments.',
      'High': 'You are reliable and well-organized. You plan ahead and take your responsibilities seriously.',
      'Moderate': 'You balance structure with flexibility. You can be organized when needed but also adapt to changing situations.',
      'Low': 'You prefer flexibility and spontaneity. You adapt quickly to changes and think on your feet.',
      'Very Low': 'You thrive in dynamic, fast-paced environments. You excel at improvisation and creative problem-solving.',
    },
    emotional_stability: {
      'Very High': 'You remain calm under pressure and handle stress exceptionally well. You provide stability in challenging situations.',
      'High': 'You manage stress effectively and maintain composure in most situations. You bounce back quickly from setbacks.',
      'Moderate': 'You handle typical workplace stress well. You may need support during particularly challenging times.',
      'Low': 'You are sensitive to stress and may need strategies to manage pressure. You benefit from supportive environments.',
      'Very Low': 'You are highly sensitive to stress. You thrive in stable, predictable environments with clear expectations.',
    },
    intellect: {
      'Very High': 'You are highly creative and love exploring new ideas. You excel at innovation and thinking outside the box.',
      'High': 'You enjoy learning and trying new approaches. You balance creativity with practical thinking.',
      'Moderate': 'You appreciate both traditional and innovative approaches. You adapt your thinking style to the situation.',
      'Low': 'You prefer proven methods and practical solutions. You value stability and consistency.',
      'Very Low': 'You strongly prefer traditional approaches and established procedures. You excel at maintaining standards.',
    },
  };

  return descriptions[dimension]?.[level] || '';
}

export function PersonalityReport({ attempt }: PersonalityReportProps) {
  const insights = attempt.personality_insights || [];

  const strengthInsights = insights.filter(i => i.category === 'Strength');
  const workStyleInsights = insights.filter(i => i.category === 'Work Style');
  const developmentInsights = insights.filter(i => i.category === 'Development Area');

  // Convert attempt scores to array format for easier mapping
  const scores = [
    { dimension: 'extraversion', percentile: attempt.extraversion_percentile || 0 },
    { dimension: 'agreeableness', percentile: attempt.agreeableness_percentile || 0 },
    { dimension: 'conscientiousness', percentile: attempt.conscientiousness_percentile || 0 },
    { dimension: 'emotional_stability', percentile: attempt.emotional_stability_percentile || 0 },
    { dimension: 'intellect', percentile: attempt.intellect_percentile || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Big Five Scores */}
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>Your Personality Dimensions</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent className="space-y-6">
          {scores.map((score) => {
            const config = dimensionConfig[score.dimension as keyof typeof dimensionConfig];
            if (!config) return null;

            const Icon = config.icon;
            const percentileLabel = getPercentileLabel(score.percentile);
            const description = getPercentileDescription(score.dimension, score.percentile);

            return (
              <div key={score.dimension} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${config.lightColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.textColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-luna-gray-900">{config.name}</h3>
                      <p className="text-sm text-luna-gray-600">{config.description}</p>
                    </div>
                  </div>
                  <LunaBadge variant="default" size="sm">
                    {percentileLabel}
                  </LunaBadge>
                </div>
                <LunaProgress value={score.percentile} variant="default" showLabel size="lg" />
                <p className="text-sm text-luna-gray-700 leading-relaxed">{description}</p>
              </div>
            );
          })}
        </LunaCardContent>
      </LunaCard>

      {/* Strengths */}
      {strengthInsights.length > 0 && (
        <LunaCard>
          <LunaCardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-luna-success" />
              <LunaCardTitle>Your Strengths</LunaCardTitle>
            </div>
          </LunaCardHeader>
          <LunaCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strengthInsights.map((insight, index) => (
                <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-green-700">{insight.description}</p>
                </div>
              ))}
            </div>
          </LunaCardContent>
        </LunaCard>
      )}

      {/* Work Style */}
      {workStyleInsights.length > 0 && (
        <LunaCard>
          <LunaCardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-luna-blue" />
              <LunaCardTitle>Your Work Style</LunaCardTitle>
            </div>
          </LunaCardHeader>
          <LunaCardContent>
            <div className="space-y-4">
              {workStyleInsights.map((insight, index) => (
                <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-blue-700">{insight.description}</p>
                </div>
              ))}
            </div>
          </LunaCardContent>
        </LunaCard>
      )}

      {/* Development Areas */}
      {developmentInsights.length > 0 && (
        <LunaCard>
          <LunaCardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-luna-warning" />
              <LunaCardTitle>Growth Opportunities</LunaCardTitle>
            </div>
          </LunaCardHeader>
          <LunaCardContent>
            <div className="space-y-4">
              {developmentInsights.map((insight, index) => (
                <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-orange-700">{insight.description}</p>
                </div>
              ))}
            </div>
          </LunaCardContent>
        </LunaCard>
      )}
    </div>
  );
}

