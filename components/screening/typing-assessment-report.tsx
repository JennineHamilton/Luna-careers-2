'use client';

import { LunaAccordionItem, LunaAccordionTrigger, LunaAccordionContent } from '@/components/luna/accordion';
import { LunaStatsCard } from '@/components/luna/stats-card';
import { LunaBadge } from '@/components/luna/badge';
import { Keyboard, Zap, Target, Clock, AlertCircle } from 'lucide-react';

interface TypingAssessmentReportProps {
  attempt: {
    id: string;
    wpm: number;
    accuracy: number;
    time_taken: number;
    errors_count: number;
    skill_level: string;
    performance_report: string;
    assessment_template?: {
      title: string;
    };
  };
  assessmentNumber?: number;
}

export function TypingAssessmentReport({ attempt, assessmentNumber = 1 }: TypingAssessmentReportProps) {
  const assessmentTitle = attempt.assessment_template?.title || `Typing Assessment ${assessmentNumber}`;
  
  // Calculate overall score (weighted: 70% accuracy, 30% speed)
  const speedScore = Math.min((attempt.wpm / 100) * 100, 100);
  const overallScore = Math.round((attempt.accuracy * 0.7) + (speedScore * 0.3));

  // Determine badge variant based on skill level
  const getBadgeVariant = (level: string) => {
    const levelLower = level?.toLowerCase() || '';
    if (levelLower.includes('expert') || levelLower.includes('advanced')) return 'success';
    if (levelLower.includes('intermediate') || levelLower.includes('proficient')) return 'primary';
    if (levelLower.includes('beginner')) return 'warning';
    return 'default';
  };

  // Extract key strengths from performance report
  const getKeyStrengths = () => {
    const strengths = [];
    if (attempt.accuracy >= 95) strengths.push('High Accuracy');
    if (attempt.wpm >= 60) strengths.push('Fast Typing');
    if (attempt.errors_count <= 5) strengths.push('Low Error Rate');
    if (attempt.accuracy >= 90 && attempt.wpm >= 50) strengths.push('Balanced Performance');
    return strengths;
  };

  const keyStrengths = getKeyStrengths();

  return (
    <LunaAccordionItem value={attempt.id} className="bg-white rounded-lg px-4 py-1 shadow-none">
      <LunaAccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-luna-blue/10 rounded-lg flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-luna-blue" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-luna-gray-900">{assessmentTitle}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-luna-gray-600">{attempt.wpm} WPM</span>
                <span className="text-xs text-luna-gray-400">•</span>
                <span className="text-xs text-luna-gray-600">{attempt.accuracy.toFixed(1)}% Accuracy</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LunaBadge variant={getBadgeVariant(attempt.skill_level)} size="sm">
              {attempt.skill_level || 'Intermediate'}
            </LunaBadge>
            <div className="text-right">
              <div className="text-xl font-bold text-luna-gray-900">{overallScore}%</div>
              <div className="text-[10px] text-luna-gray-500">Overall Score</div>
            </div>
          </div>
        </div>
      </LunaAccordionTrigger>

      <LunaAccordionContent>
        <div className="space-y-4 pt-3">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <LunaStatsCard
              title="Words Per Minute"
              value={attempt.wpm}
              icon={<Zap className="w-5 h-5" />}
            />
            <LunaStatsCard
              title="Accuracy Rate"
              value={`${attempt.accuracy.toFixed(1)}%`}
              icon={<Target className="w-5 h-5" />}
            />
            <LunaStatsCard
              title="Total Errors"
              value={attempt.errors_count}
              icon={<AlertCircle className="w-5 h-5" />}
            />
            <LunaStatsCard
              title="Time Taken"
              value={`${Math.floor(attempt.time_taken / 60)}:${(attempt.time_taken % 60).toString().padStart(2, '0')}`}
              description="minutes"
              icon={<Clock className="w-5 h-5" />}
            />
          </div>

          {/* Key Strengths */}
          {keyStrengths.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-luna-gray-900 mb-2">Key Strengths</h5>
              <div className="flex flex-wrap gap-1.5">
                {keyStrengths.map((strength, index) => (
                  <LunaBadge key={index} variant="success" size="sm">
                    {strength}
                  </LunaBadge>
                ))}
              </div>
            </div>
          )}

          {/* Performance Analysis */}
          {attempt.performance_report && (
            <div className="bg-luna-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-luna-gray-900 mb-1.5">Performance Analysis</h5>
              <p className="text-xs text-luna-gray-700 leading-relaxed whitespace-pre-wrap">
                {attempt.performance_report}
              </p>
            </div>
          )}

        </div>
      </LunaAccordionContent>
    </LunaAccordionItem>
  );
}

