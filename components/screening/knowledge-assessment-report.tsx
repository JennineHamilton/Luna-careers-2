'use client';

import { LunaAccordionItem, LunaAccordionTrigger, LunaAccordionContent } from '@/components/luna/accordion';
import { LunaStatsCard } from '@/components/luna/stats-card';
import { LunaBadge } from '@/components/luna/badge';
import { Brain, CheckCircle, XCircle, Clock, Target } from 'lucide-react';

interface KnowledgeAssessmentReportProps {
  attempt: {
    id: string;
    total_questions: number;
    correct_answers: number;
    score_percentage: number;
    passed: boolean;
    time_taken_seconds: number;
    completed_at: string;
    assessment?: {
      title: string;
      category: string;
      passing_threshold: number;
    };
  };
}

export function KnowledgeAssessmentReport({ attempt }: KnowledgeAssessmentReportProps) {
  const assessmentTitle = attempt.assessment?.title || 'Knowledge Assessment';
  const category = attempt.assessment?.category || 'General';
  const passingThreshold = attempt.assessment?.passing_threshold || 70;
  
  // Format time taken
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Determine badge variant based on pass/fail
  const getBadgeVariant = () => {
    if (attempt.passed) return 'success';
    return 'warning';
  };

  // Get performance level
  const getPerformanceLevel = () => {
    const score = attempt.score_percentage;
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= passingThreshold) return 'Good';
    return 'Needs Improvement';
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
              <h4 className="text-sm font-semibold text-luna-gray-900">{assessmentTitle}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-luna-gray-600">{category}</span>
                <span className="text-xs text-luna-gray-400">•</span>
                <span className="text-xs text-luna-gray-600">
                  {attempt.correct_answers}/{attempt.total_questions} Correct
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LunaBadge variant={getBadgeVariant()} size="sm">
              {attempt.passed ? 'Passed' : 'Not Passed'}
            </LunaBadge>
            <div className="text-right">
              <div className="text-xl font-bold text-luna-gray-900">{Math.round(attempt.score_percentage)}%</div>
              <div className="text-[10px] text-luna-gray-500">Score</div>
            </div>
          </div>
        </div>
      </LunaAccordionTrigger>

      <LunaAccordionContent>
        <div className="space-y-4 pt-3">
          {/* Performance KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <LunaStatsCard
              title="Score"
              value={`${Math.round(attempt.score_percentage)}%`}
              description={getPerformanceLevel()}
              icon={<Target className="w-4 h-4" />}
            />
            <LunaStatsCard
              title="Correct Answers"
              value={attempt.correct_answers.toString()}
              description={`Out of ${attempt.total_questions}`}
              icon={<CheckCircle className="w-4 h-4" />}
            />
            <LunaStatsCard
              title="Incorrect"
              value={(attempt.total_questions - attempt.correct_answers).toString()}
              description="Questions"
              icon={<XCircle className="w-4 h-4" />}
            />
            <LunaStatsCard
              title="Time Taken"
              value={formatTime(attempt.time_taken_seconds)}
              description="Duration"
              icon={<Clock className="w-4 h-4" />}
            />
          </div>

          {/* Performance Summary */}
          <div className={`rounded-lg p-3 ${attempt.passed ? 'bg-green-50' : 'bg-orange-50'}`}>
            <h5 className={`text-xs font-semibold mb-1.5 ${attempt.passed ? 'text-green-900' : 'text-orange-900'}`}>
              Performance Summary
            </h5>
            <p className={`text-xs leading-relaxed ${attempt.passed ? 'text-green-800' : 'text-orange-800'}`}>
              {attempt.passed 
                ? `You successfully passed this assessment with a score of ${Math.round(attempt.score_percentage)}%, exceeding the passing threshold of ${passingThreshold}%. Great job!`
                : `You scored ${Math.round(attempt.score_percentage)}%, which is below the passing threshold of ${passingThreshold}%. Consider reviewing the material and retaking the assessment.`
              }
            </p>
          </div>

          {/* Category Info */}
          <div className="bg-luna-gray-50 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-luna-gray-900 mb-1.5">Assessment Details</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-luna-gray-600">Category:</span>
                <span className="ml-1 font-medium text-luna-gray-900">{category}</span>
              </div>
              <div>
                <span className="text-luna-gray-600">Passing Score:</span>
                <span className="ml-1 font-medium text-luna-gray-900">{passingThreshold}%</span>
              </div>
            </div>
          </div>
        </div>
      </LunaAccordionContent>
    </LunaAccordionItem>
  );
}

