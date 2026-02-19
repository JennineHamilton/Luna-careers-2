'use client';

import { useState, useEffect } from 'react';
import { LunaAccordion, LunaAccordionItem, LunaAccordionTrigger, LunaAccordionContent } from '@/components/luna/accordion';
import { Loader2, ClipboardCheck, Keyboard, Brain, Lightbulb } from 'lucide-react';
import { TypingAssessmentReport } from './typing-assessment-report';
import { PersonalityAssessmentReport } from './personality-assessment-report';
import { CognitiveAssessmentReport } from './cognitive-assessment-report';
import { KnowledgeAssessmentReport } from './knowledge-assessment-report';
import { AssessmentSummary } from './assessment-summary';

interface PreScreeningReportProps {
  // Optional: can be used if data is passed from parent
  initialData?: any;
}

export function PreScreeningReport({ initialData }: PreScreeningReportProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
    } else {
      fetchScreeningResults();
    }
  }, [initialData]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-luna-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-none">
        <div className="text-center text-luna-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Check if user has any completed assessments
  const hasTyping = data?.typing && data.typing.length > 0;
  const hasPersonality = data?.personality && data.personality.length > 0;
  const hasCognitive = data?.cognitive && data.cognitive.length > 0;
  const hasKnowledge = data?.knowledge && data.knowledge.length > 0;
  const hasAnyAssessment = hasTyping || hasPersonality || hasCognitive || hasKnowledge;

  if (!hasAnyAssessment) {
    return (
      <div className="bg-white rounded-lg py-12 px-6 shadow-none">
        <div className="text-center">
          <div className="w-16 h-16 bg-luna-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-luna-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-luna-gray-900 mb-2">No Assessments Completed</h3>
          <p className="text-sm text-luna-gray-600 max-w-md mx-auto">
            Complete pre-screening assessments to showcase your skills and capabilities to potential employers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall Summary */}
      <AssessmentSummary data={data} />

      {/* Individual Assessment Reports */}
      <LunaAccordion type="multiple" className="space-y-2">
        {/* Typing Assessment */}
        {hasTyping && data.typing.map((attempt: any, index: number) => (
          <TypingAssessmentReport 
            key={attempt.id || index} 
            attempt={attempt}
            assessmentNumber={index + 1}
          />
        ))}

        {/* Personality Assessment */}
        {hasPersonality && data.personality.map((attempt: any, index: number) => (
          <PersonalityAssessmentReport 
            key={attempt.id || index} 
            attempt={attempt}
          />
        ))}

        {/* Cognitive Assessment */}
        {hasCognitive && data.cognitive.map((attempt: any, index: number) => (
          <CognitiveAssessmentReport
            key={attempt.id || index}
            attempt={attempt}
          />
        ))}

        {/* Knowledge Assessment */}
        {hasKnowledge && data.knowledge.map((attempt: any, index: number) => (
          <KnowledgeAssessmentReport
            key={attempt.id || index}
            attempt={attempt}
          />
        ))}
      </LunaAccordion>
    </div>
  );
}

