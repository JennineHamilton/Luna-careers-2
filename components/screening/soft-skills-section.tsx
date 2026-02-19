'use client';

import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';
import { LunaBadge } from '@/components/luna/badge';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { PersonalityReport } from './personality-report';

interface SoftSkillsSectionProps {
  data: {
    personality: any[];
    summary: {
      has_personality: boolean;
    };
  };
}

export function SoftSkillsSection({ data }: SoftSkillsSectionProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!data.summary.has_personality || data.personality.length === 0) {
    return null;
  }

  const attempt = data.personality[0];

  // Calculate primary descriptor from top 2 traits
  const traits = [
    { name: 'Conscientiousness', score: attempt.conscientiousness_percentile },
    { name: 'Agreeableness', score: attempt.agreeableness_percentile },
    { name: 'Extraversion', score: attempt.extraversion_percentile },
    { name: 'Emotional Stability', score: attempt.emotional_stability_percentile },
    { name: 'Intellect', score: attempt.intellect_percentile },
  ].sort((a, b) => b.score - a.score);

  const topTrait = traits[0];
  const secondTrait = traits[1];

  const getDescriptor = () => {
    const top = topTrait.name;
    const second = secondTrait.name;

    if (top === 'Conscientiousness' && second === 'Agreeableness') return 'Conscientious & Collaborative';
    if (top === 'Extraversion' && second === 'Intellect') return 'Energetic & Innovative';
    if (top === 'Conscientiousness' && second === 'Emotional Stability') return 'Reliable & Composed';
    if (top === 'Intellect' && second === 'Agreeableness') return 'Creative & Empathetic';
    if (top === 'Extraversion' && second === 'Agreeableness') return 'Personable & Team-Oriented';
    
    return 'Well-Rounded Professional';
  };

  return (
    <LunaCard>
      <LunaCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <LunaCardTitle>Soft Skills</LunaCardTitle>
              <p className="text-sm text-luna-gray-600 mt-1">Personality & interpersonal capabilities</p>
            </div>
          </div>
        </div>
      </LunaCardHeader>
      <LunaCardContent className="space-y-4">
        {/* Personality Summary Card */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-luna-gray-900">Professional Personality Profile</h3>
              <p className="text-sm text-luna-gray-600 mt-1">Based on the Big Five framework</p>
            </div>
            <LunaBadge variant="success" size="sm">Completed</LunaBadge>
          </div>
          
          <div className="mt-3">
            <div className="text-lg font-semibold text-purple-900 mb-1">{getDescriptor()}</div>
            <p className="text-sm text-luna-gray-700">
              Your personality profile shows strong {topTrait.name.toLowerCase()} and {secondTrait.name.toLowerCase()} traits, 
              indicating you work well in collaborative environments with clear structure.
            </p>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900 transition-colors"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide detailed breakdown
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                View detailed breakdown
              </>
            )}
          </button>
        </div>

        {/* Detailed Personality Report (Collapsible) */}
        {showDetails && (
          <div className="mt-4">
            <PersonalityReport attempt={attempt} />
          </div>
        )}

        {/* Placeholder for other soft skills assessments */}
        <div className="p-4 bg-luna-gray-50 rounded-lg border border-luna-gray-200">
          <p className="text-sm text-luna-gray-600 italic">
            Additional soft skills assessments (EQ, Customer Service, Sales, etc.) will appear here when completed.
          </p>
        </div>
      </LunaCardContent>
    </LunaCard>
  );
}

