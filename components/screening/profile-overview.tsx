'use client';

import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';
import { LunaBadge } from '@/components/luna/badge';
import { Sparkles } from 'lucide-react';

interface ProfileOverviewProps {
  data: {
    summary: {
      total_assessments: number;
      has_personality: boolean;
      has_typing: boolean;
      has_transcription: boolean;
    };
  };
}

export function ProfileOverview({ data }: ProfileOverviewProps) {
  const { total_assessments } = data.summary;

  // Placeholder overview - will implement algorithm in Phase 2
  const getOverviewText = () => {
    if (total_assessments === 0) {
      return {
        title: "Complete Your Professional Profile",
        description: "Complete pre-screening assessments to generate a comprehensive professional summary showcasing your unique capabilities and ideal role matches.",
        badge: null
      };
    }

    if (total_assessments <= 2) {
      return {
        title: "Preliminary Profile",
        description: "You've completed your first assessments! Complete additional assessments to build a more comprehensive professional profile.",
        badge: "Getting Started"
      };
    }

    if (total_assessments <= 5) {
      return {
        title: "Developing Profile",
        description: "Your professional profile is taking shape. Based on your completed assessments, you're demonstrating strong capabilities across multiple areas.",
        badge: "In Progress"
      };
    }

    return {
      title: "Comprehensive Profile",
      description: "Your professional profile showcases a well-rounded skill set with validated capabilities across multiple assessment areas.",
      badge: "Complete"
    };
  };

  const overview = getOverviewText();

  return (
    <LunaCard className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <LunaCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <LunaCardTitle className="text-purple-900">{overview.title}</LunaCardTitle>
              <p className="text-sm text-purple-700 mt-1">
                {total_assessments} {total_assessments === 1 ? 'assessment' : 'assessments'} completed
              </p>
            </div>
          </div>
          {overview.badge && (
            <LunaBadge variant="default" size="sm">
              {overview.badge}
            </LunaBadge>
          )}
        </div>
      </LunaCardHeader>
      <LunaCardContent>
        <p className="text-luna-gray-700 leading-relaxed">
          {overview.description}
        </p>
        
        {/* Placeholder for Phase 2 algorithm output */}
        {total_assessments >= 3 && (
          <div className="mt-4 p-4 bg-white/60 rounded-lg border border-purple-200">
            <p className="text-sm text-luna-gray-600 italic">
              💡 Your personalized professional summary will appear here once the overview algorithm is implemented.
            </p>
          </div>
        )}
      </LunaCardContent>
    </LunaCard>
  );
}

