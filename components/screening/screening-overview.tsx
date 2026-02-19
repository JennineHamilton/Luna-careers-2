'use client';

import { LunaCard, LunaCardContent } from '@/components/luna/card';
import { LunaBadge } from '@/components/luna/badge';
import { CheckCircle2, Brain, Keyboard, Mic } from 'lucide-react';

interface ScreeningOverviewProps {
  summary: {
    total_assessments: number;
    has_personality: boolean;
    has_typing: boolean;
    has_transcription: boolean;
  };
}

export function ScreeningOverview({ summary }: ScreeningOverviewProps) {
  const assessments = [
    {
      name: 'Personality Profile',
      completed: summary.has_personality,
      icon: Brain,
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Typing Skills',
      completed: summary.has_typing,
      icon: Keyboard,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Transcription Skills',
      completed: summary.has_transcription,
      icon: Mic,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <LunaCard>
      <LunaCardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-luna-gray-900">Screening Assessment Report</h2>
            <p className="text-sm text-luna-gray-600 mt-1">
              Your comprehensive pre-screening assessment results
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-luna-blue">{summary.total_assessments}</div>
            <div className="text-sm text-luna-gray-600">Completed</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assessments.map((assessment) => {
            const Icon = assessment.icon;
            return (
              <div
                key={assessment.name}
                className={`p-4 rounded-lg border-2 ${
                  assessment.completed
                    ? 'border-luna-success bg-luna-success/5'
                    : 'border-luna-gray-200 bg-luna-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${assessment.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${assessment.iconColor}`} />
                  </div>
                  {assessment.completed && (
                    <CheckCircle2 className="w-5 h-5 text-luna-success" />
                  )}
                </div>
                <h3 className="font-semibold text-luna-gray-900 mb-1">{assessment.name}</h3>
                <LunaBadge
                  variant={assessment.completed ? 'success' : 'default'}
                  size="sm"
                >
                  {assessment.completed ? 'Completed' : 'Not Started'}
                </LunaBadge>
              </div>
            );
          })}
        </div>
      </LunaCardContent>
    </LunaCard>
  );
}

