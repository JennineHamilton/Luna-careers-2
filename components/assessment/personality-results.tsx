'use client';

import { useState } from 'react';
import { LunaCard } from '@/components/luna/card';
import { LunaButton } from '@/components/luna/button';
import { LunaBadge } from '@/components/luna/badge';
import { 
  Brain, 
  Briefcase, 
  TrendingUp, 
  Users, 
  Target,
  CheckCircle2,
  Share2,
  Download
} from 'lucide-react';

interface PersonalityAttempt {
  id: string;
  status: string | null;
  extraversion_score: number | null;
  agreeableness_score: number | null;
  conscientiousness_score: number | null;
  emotional_stability_score: number | null;
  intellect_score: number | null;
  extraversion_percentile: number | null;
  agreeableness_percentile: number | null;
  conscientiousness_percentile: number | null;
  emotional_stability_percentile: number | null;
  intellect_percentile: number | null;
  completed_at: string | null;
  submitted_at: string | null;
}

interface Insight {
  id: string;
  category: string;
  title: string;
  description: string;
  research_source: string;
  confidence_level: string;
}

interface JobRecommendation {
  id: string;
  job_family: string;
  match_strength: string;
  example_roles: string[] | null;
  rationale: string;
  research_source: string;
}

interface PersonalityResultsProps {
  attempt: PersonalityAttempt;
  insights: Insight[];
  recommendations: JobRecommendation[];
}

const BIG_FIVE_LABELS = {
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  conscientiousness: 'Conscientiousness',
  emotional_stability: 'Emotional Stability',
  intellect: 'Intellect/Imagination'
};

export function PersonalityResults({ attempt, insights, recommendations }: PersonalityResultsProps) {
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'insights' | 'careers' | 'development'>('profile');

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/personality/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attempt.id })
      });

      if (!res.ok) {
        throw new Error('Failed to submit');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const scores = {
    extraversion: attempt.extraversion_score || 0,
    agreeableness: attempt.agreeableness_score || 0,
    conscientiousness: attempt.conscientiousness_score || 0,
    emotional_stability: attempt.emotional_stability_score || 0,
    intellect: attempt.intellect_score || 0
  };

  const percentiles = {
    extraversion: attempt.extraversion_percentile || 0,
    agreeableness: attempt.agreeableness_percentile || 0,
    conscientiousness: attempt.conscientiousness_percentile || 0,
    emotional_stability: attempt.emotional_stability_percentile || 0,
    intellect: attempt.intellect_percentile || 0
  };

  const developmentInsights = insights.filter(i => i.category === 'Development Area');
  const workInsights = insights.filter(i => i.category !== 'Development Area');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Professional Personality Profile</h1>
          <p className="text-muted-foreground">
            Based on the scientifically validated IPIP-50 Big Five assessment
          </p>
        </div>
        {attempt.status === 'completed' && !attempt.submitted_at && (
          <LunaButton onClick={handleSubmit} disabled={submitting}>
            <Share2 className="w-4 h-4 mr-2" />
            {submitting ? 'Submitting...' : 'Share with Employers'}
          </LunaButton>
        )}
        {attempt.submitted_at && (
          <LunaBadge variant="success">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Shared with Employers
          </LunaBadge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'profile'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Brain className="w-4 h-4 inline mr-2" />
          Personality Profile
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'insights'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Work Insights
        </button>
        <button
          onClick={() => setActiveTab('careers')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'careers'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Briefcase className="w-4 h-4 inline mr-2" />
          Career Recommendations
        </button>
        <button
          onClick={() => setActiveTab('development')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'development'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Development Areas
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <LunaCard className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Big Five Personality Scores</h2>
              <div className="space-y-4">
                {Object.entries(BIG_FIVE_LABELS).map(([key, label]) => {
                  const score = scores[key as keyof typeof scores];
                  const percentile = percentiles[key as keyof typeof percentiles];

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{label}</span>
                        <div className="text-sm text-muted-foreground">
                          Score: {Math.round(score)} | {percentile}th percentile
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getScoreDescription(key as keyof typeof scores, percentile)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </LunaCard>

            <LunaCard className="p-6 bg-muted/50">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-2">About Your Scores</p>
                  <p className="text-muted-foreground">
                    Your scores are based on the IPIP-50 assessment, a scientifically validated measure
                    of the Big Five personality dimensions. Percentiles show how you compare to a large
                    normative sample (N ≈ 20,000). Higher percentiles indicate stronger expression of
                    that trait.
                  </p>
                </div>
              </div>
            </LunaCard>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            {workInsights.length === 0 ? (
              <LunaCard className="p-8 text-center">
                <p className="text-muted-foreground">No workplace insights available.</p>
              </LunaCard>
            ) : (
              workInsights.map((insight) => (
                <LunaCard key={insight.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <LunaBadge variant="primary" className="mb-2">
                        {insight.category}
                      </LunaBadge>
                      <h3 className="text-lg font-semibold">{insight.title}</h3>
                    </div>
                    <LunaBadge
                      variant={
                        insight.confidence_level === 'high' ? 'success' :
                        insight.confidence_level === 'moderate' ? 'yellow' : 'default'
                      }
                    >
                      {insight.confidence_level} confidence
                    </LunaBadge>
                  </div>
                  <p className="text-muted-foreground mb-3">{insight.description}</p>
                  <p className="text-xs text-muted-foreground italic">
                    Research: {insight.research_source}
                  </p>
                </LunaCard>
              ))
            )}
          </div>
        )}

        {activeTab === 'careers' && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <LunaCard className="p-8 text-center">
                <p className="text-muted-foreground">No career recommendations available.</p>
              </LunaCard>
            ) : (
              recommendations.map((rec) => (
                <LunaCard key={rec.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{rec.job_family}</h3>
                    <LunaBadge
                      variant={
                        rec.match_strength === 'strong' ? 'success' :
                        rec.match_strength === 'moderate' ? 'yellow' : 'default'
                      }
                    >
                      {rec.match_strength} match
                    </LunaBadge>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Example Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {(rec.example_roles || []).map((role, idx) => (
                        <LunaBadge key={idx} variant="default">
                          {role}
                        </LunaBadge>
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-3">{rec.rationale}</p>
                  <p className="text-xs text-muted-foreground italic">
                    Research: {rec.research_source}
                  </p>
                </LunaCard>
              ))
            )}
          </div>
        )}

        {activeTab === 'development' && (
          <div className="space-y-4">
            {developmentInsights.length === 0 ? (
              <LunaCard className="p-8 text-center">
                <p className="text-muted-foreground">No development areas identified.</p>
              </LunaCard>
            ) : (
              developmentInsights.map((insight) => (
                <LunaCard key={insight.id} className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Target className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
                      <p className="text-muted-foreground mb-3">{insight.description}</p>
                      <p className="text-xs text-muted-foreground italic">
                        Research: {insight.research_source}
                      </p>
                    </div>
                  </div>
                </LunaCard>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getScoreDescription(dimension: string, percentile: number): string {
  if (percentile >= 70) {
    return `You score high on ${dimension}, placing you in the top 30% of people.`;
  } else if (percentile >= 30) {
    return `You score in the moderate range on ${dimension}, similar to most people.`;
  } else {
    return `You score lower on ${dimension}, which is characteristic of about 30% of people.`;
  }
}

