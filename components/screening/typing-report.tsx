'use client';

import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';
import { LunaProgress } from '@/components/luna/progress';
import { LunaBadge } from '@/components/luna/badge';
import { LunaChart } from '@/components/luna/chart';
import { Gauge, Target, AlertCircle, TrendingUp } from 'lucide-react';

interface TypingAttempt {
  id: string;
  status: string;
  started_at: string;
  completed_at: string;
  wpm: number;
  accuracy: number;
  errors_count: number;
  time_taken: number;
  assessment_templates: {
    id: string;
    title: string;
    assessment_type: string;
  };
}

interface TypingReportProps {
  attempts: TypingAttempt[];
  isTranscription?: boolean;
}

function getPerformanceLevel(wpm: number, accuracy: number): {
  level: string;
  color: 'success' | 'warning' | 'error' | 'default';
  description: string;
} {
  if (wpm >= 60 && accuracy >= 95) {
    return {
      level: 'Advanced',
      color: 'success',
      description: 'Excellent typing skills! You type quickly and accurately.',
    };
  } else if (wpm >= 40 && accuracy >= 90) {
    return {
      level: 'Intermediate',
      color: 'warning',
      description: 'Good typing skills. With practice, you can improve further.',
    };
  } else {
    return {
      level: 'Beginner',
      color: 'default',
      description: 'Keep practicing! Your typing speed and accuracy will improve over time.',
    };
  }
}

function getWPMBenchmark(wpm: number): string {
  if (wpm >= 80) return 'You type faster than 95% of people!';
  if (wpm >= 60) return 'You type faster than 75% of people.';
  if (wpm >= 40) return 'You type at an average speed.';
  if (wpm >= 20) return 'You type slower than average, but practice will help!';
  return 'Keep practicing to build your typing speed.';
}

function getAccuracyFeedback(accuracy: number): string {
  if (accuracy >= 98) return 'Outstanding accuracy! You make very few mistakes.';
  if (accuracy >= 95) return 'Great accuracy! You maintain high quality while typing.';
  if (accuracy >= 90) return 'Good accuracy. Focus on reducing errors for even better results.';
  if (accuracy >= 85) return 'Fair accuracy. Take your time to improve precision.';
  return 'Focus on accuracy before speed. Slow down and type carefully.';
}

export function TypingReport({ attempts, isTranscription = false }: TypingReportProps) {
  if (!attempts || attempts.length === 0) {
    return null;
  }

  // Get the most recent attempt
  const latestAttempt = attempts[0];
  const performance = getPerformanceLevel(latestAttempt.wpm, latestAttempt.accuracy);

  // Prepare chart data for multiple attempts
  const chartData = attempts
    .slice(0, 5) // Show last 5 attempts
    .reverse()
    .map((attempt, index) => ({
      attempt: `Test ${attempts.length - index}`,
      wpm: attempt.wpm,
      accuracy: attempt.accuracy,
    }));

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>Performance Summary</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* WPM */}
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <Gauge className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-4xl font-bold text-blue-900 mb-1">{latestAttempt.wpm}</div>
              <div className="text-sm font-medium text-blue-700 mb-2">Words Per Minute</div>
              <p className="text-xs text-blue-600">{getWPMBenchmark(latestAttempt.wpm)}</p>
            </div>

            {/* Accuracy */}
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-4xl font-bold text-green-900 mb-1">{latestAttempt.accuracy}%</div>
              <div className="text-sm font-medium text-green-700 mb-2">Accuracy</div>
              <p className="text-xs text-green-600">{getAccuracyFeedback(latestAttempt.accuracy)}</p>
            </div>

            {/* Performance Level */}
            <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="mb-3">
                <LunaBadge variant={performance.color} size="lg">
                  {performance.level}
                </LunaBadge>
              </div>
              <div className="text-sm font-medium text-purple-700 mb-2">Skill Level</div>
              <p className="text-xs text-purple-600">{performance.description}</p>
            </div>
          </div>
        </LunaCardContent>
      </LunaCard>

      {/* Detailed Metrics */}
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>Detailed Metrics</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-luna-gray-700">Typing Speed</span>
              <span className="text-sm font-semibold text-luna-gray-900">{latestAttempt.wpm} WPM</span>
            </div>
            <LunaProgress value={Math.min((latestAttempt.wpm / 100) * 100, 100)} variant="default" size="lg" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-luna-gray-700">Accuracy</span>
              <span className="text-sm font-semibold text-luna-gray-900">{latestAttempt.accuracy}%</span>
            </div>
            <LunaProgress value={latestAttempt.accuracy} variant="success" size="lg" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-luna-gray-200">
            <div>
              <div className="text-sm text-luna-gray-600 mb-1">Total Errors</div>
              <div className="text-2xl font-bold text-luna-gray-900">{latestAttempt.errors_count}</div>
            </div>
            <div>
              <div className="text-sm text-luna-gray-600 mb-1">Time Taken</div>
              <div className="text-2xl font-bold text-luna-gray-900">
                {Math.floor(latestAttempt.time_taken / 60)}:{(latestAttempt.time_taken % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </LunaCardContent>
      </LunaCard>

      {/* Progress Over Time (if multiple attempts) */}
      {attempts.length > 1 && (
        <LunaCard>
          <LunaCardHeader>
            <LunaCardTitle>Your Progress</LunaCardTitle>
          </LunaCardHeader>
          <LunaCardContent>
            <LunaChart
              type="line"
              data={chartData}
              dataKey="attempt"
              series={[
                { key: 'wpm', name: 'Words Per Minute', color: '#1449E8' },
                { key: 'accuracy', name: 'Accuracy %', color: '#10B981' },
              ]}
              height={300}
            />
          </LunaCardContent>
        </LunaCard>
      )}
    </div>
  );
}
