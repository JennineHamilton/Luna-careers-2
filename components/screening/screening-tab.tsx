'use client';

import { useState, useEffect } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';
import { LunaBadge } from '@/components/luna/badge';
import { Loader2, ClipboardCheck, Brain, Target, Code, Briefcase } from 'lucide-react';
import { ProfileOverview } from './profile-overview';
import { SoftSkillsSection } from './soft-skills-section';
import { CognitiveSection } from './cognitive-section';
import { TechnicalSkillsSection } from './technical-skills-section';
import { WorkPreferencesSection } from './work-preferences-section';

interface ScreeningData {
  personality: any[];
  typing: any[];
  transcription: any[];
  cognitive: any[];
  knowledge: any[];
  summary: {
    total_assessments: number;
    has_personality: boolean;
    has_typing: boolean;
    has_transcription: boolean;
    has_cognitive: boolean;
    has_knowledge: boolean;
  };
}

export function ScreeningTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ScreeningData | null>(null);

  useEffect(() => {
    const fetchScreeningResults = async () => {
      try {
        const response = await fetch('/api/screening/results');
        if (!response.ok) {
          throw new Error('Failed to fetch screening results');
        }
        const results = await response.json();
        setData(results);
      } catch (err) {
        console.error('Error fetching screening results:', err);
        setError('Failed to load screening results');
      } finally {
        setLoading(false);
      }
    };

    fetchScreeningResults();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-luna-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-luna-error">{error}</p>
      </div>
    );
  }

  if (!data || data.summary.total_assessments === 0) {
    return (
      <div className="mt-6">
        <LunaCard>
          <LunaCardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-luna-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-8 h-8 text-luna-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-luna-gray-900 mb-2">No Screening Assessments Completed</h3>
              <p className="text-sm text-luna-gray-600 max-w-md mx-auto">
                Complete pre-screening assessments to generate your professional profile.
                Your screening report will help employers understand your skills and work style.
              </p>
            </div>
          </LunaCardContent>
        </LunaCard>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Professional Profile Overview */}
      <ProfileOverview data={data} />

      {/* Soft Skills Section */}
      <SoftSkillsSection data={data} />

      {/* Cognitive Abilities Section */}
      <CognitiveSection data={data} />

      {/* Technical/Practical Skills Section */}
      <TechnicalSkillsSection data={data} />

      {/* Work Preferences Section */}
      <WorkPreferencesSection data={data} />
    </div>
  );
}

