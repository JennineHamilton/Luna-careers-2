'use client';

import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';
import { LunaBadge } from '@/components/luna/badge';
import { Code, Keyboard, Mic } from 'lucide-react';

interface TechnicalSkillsSectionProps {
  data: {
    typing: any[];
    transcription: any[];
    summary: {
      has_typing: boolean;
      has_transcription: boolean;
    };
  };
}

export function TechnicalSkillsSection({ data }: TechnicalSkillsSectionProps) {
  const hasAnySkills = data.summary.has_typing || data.summary.has_transcription;

  const getPerformanceLevel = (wpm: number, accuracy: number) => {
    if (wpm >= 70 && accuracy >= 95) return { level: 'Advanced', variant: 'success' as const };
    if (wpm >= 50 && accuracy >= 90) return { level: 'Intermediate', variant: 'default' as const };
    return { level: 'Beginner', variant: 'warning' as const };
  };

  const getWPMInsight = (wpm: number) => {
    if (wpm >= 80) return 'Exceptional speed - faster than 90% of people';
    if (wpm >= 70) return 'Excellent speed - faster than 75% of people';
    if (wpm >= 60) return 'Good speed - faster than 60% of people';
    if (wpm >= 50) return 'Average speed - suitable for most roles';
    return 'Developing speed - practice recommended';
  };

  return (
    <LunaCard>
      <LunaCardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <LunaCardTitle>Technical & Practical Skills</LunaCardTitle>
            <p className="text-sm text-luna-gray-600 mt-1">Typing, coding, and technical proficiencies</p>
          </div>
        </div>
      </LunaCardHeader>
      <LunaCardContent className="space-y-4">
        {/* Typing Skills */}
        {data.summary.has_typing && data.typing.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Keyboard className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-luna-gray-900">Typing Skills Assessment</h3>
                  <p className="text-xs text-luna-gray-600 mt-0.5">
                    Completed {new Date(data.typing[0].completed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <LunaBadge 
                variant={getPerformanceLevel(data.typing[0].wpm, data.typing[0].accuracy).variant} 
                size="sm"
              >
                {getPerformanceLevel(data.typing[0].wpm, data.typing[0].accuracy).level}
              </LunaBadge>
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-blue-900">{data.typing[0].wpm}</span>
              <span className="text-sm font-medium text-blue-700">WPM</span>
              <span className="text-luna-gray-400 mx-2">•</span>
              <span className="text-2xl font-bold text-blue-900">{data.typing[0].accuracy}%</span>
              <span className="text-sm font-medium text-blue-700">Accuracy</span>
            </div>
            
            <p className="text-sm text-luna-gray-700">
              {getWPMInsight(data.typing[0].wpm)}
            </p>
          </div>
        )}

        {/* Transcription Skills */}
        {data.summary.has_transcription && data.transcription.length > 0 && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mic className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-luna-gray-900">Transcription Skills Assessment</h3>
                  <p className="text-xs text-luna-gray-600 mt-0.5">
                    Completed {new Date(data.transcription[0].completed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <LunaBadge 
                variant={getPerformanceLevel(data.transcription[0].wpm, data.transcription[0].accuracy).variant} 
                size="sm"
              >
                {getPerformanceLevel(data.transcription[0].wpm, data.transcription[0].accuracy).level}
              </LunaBadge>
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-green-900">{data.transcription[0].wpm}</span>
              <span className="text-sm font-medium text-green-700">WPM</span>
              <span className="text-luna-gray-400 mx-2">•</span>
              <span className="text-2xl font-bold text-green-900">{data.transcription[0].accuracy}%</span>
              <span className="text-sm font-medium text-green-700">Accuracy</span>
            </div>
            
            <p className="text-sm text-luna-gray-700">
              Solid transcription skills - suitable for audio typing roles
            </p>
          </div>
        )}

        {/* Placeholder for other technical skills */}
        {!hasAnySkills && (
          <div className="p-4 bg-luna-gray-50 rounded-lg border border-luna-gray-200">
            <p className="text-sm text-luna-gray-600 italic">
              Technical skills assessments (Typing, Coding, Tools) will appear here when completed.
            </p>
          </div>
        )}
      </LunaCardContent>
    </LunaCard>
  );
}

