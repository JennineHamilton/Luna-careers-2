'use client';

import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';
import { Briefcase } from 'lucide-react';

interface WorkPreferencesSectionProps {
  data: any;
}

export function WorkPreferencesSection({ data }: WorkPreferencesSectionProps) {
  // Placeholder - will be populated when work preferences assessments are added
  return (
    <LunaCard>
      <LunaCardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <LunaCardTitle>Work Preferences</LunaCardTitle>
            <p className="text-sm text-luna-gray-600 mt-1">Workplace fit & work style</p>
          </div>
        </div>
      </LunaCardHeader>
      <LunaCardContent>
        <div className="p-4 bg-luna-gray-50 rounded-lg border border-luna-gray-200">
          <p className="text-sm text-luna-gray-600 italic">
            Work preferences assessments (Workplace Fit, Work Style) will appear here when completed.
          </p>
        </div>
      </LunaCardContent>
    </LunaCard>
  );
}

