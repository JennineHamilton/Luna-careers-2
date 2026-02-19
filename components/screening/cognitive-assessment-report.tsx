'use client';

import { LunaAccordionItem, LunaAccordionTrigger, LunaAccordionContent } from '@/components/luna/accordion';
import { LunaStatsCard } from '@/components/luna/stats-card';
import { LunaBadge } from '@/components/luna/badge';
import { LunaChart } from '@/components/luna/chart';
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

interface CognitiveAssessmentReportProps {
  attempt: {
    id: string;
    overall_percentile: number;
    verbal_percentile: number;
    numerical_percentile: number;
    abstract_percentile: number;
    attention_percentile: number;
    correct_answers: number;
    total_questions: number;
  };
}

export function CognitiveAssessmentReport({ attempt }: CognitiveAssessmentReportProps) {
  // Domain scores
  const domains = [
    { name: 'Verbal Reasoning', percentile: attempt.verbal_percentile, icon: '📝' },
    { name: 'Numerical Reasoning', percentile: attempt.numerical_percentile, icon: '🔢' },
    { name: 'Abstract Reasoning', percentile: attempt.abstract_percentile, icon: '🧩' },
    { name: 'Attention to Detail', percentile: attempt.attention_percentile, icon: '🎯' },
  ].sort((a, b) => b.percentile - a.percentile);

  const topDomain = domains[0];
  const weakestDomain = domains[domains.length - 1];

  // Prepare bar chart data
  const chartData = domains.map(d => ({
    name: d.name.replace(' Reasoning', '').replace(' to Detail', ''),
    percentile: d.percentile,
  }));

  // Get performance level
  const getPerformanceLevel = (percentile: number) => {
    if (percentile >= 90) return { label: 'Exceptional', variant: 'success' as const };
    if (percentile >= 75) return { label: 'Above Average', variant: 'primary' as const };
    if (percentile >= 50) return { label: 'Average', variant: 'default' as const };
    if (percentile >= 25) return { label: 'Below Average', variant: 'warning' as const };
    return { label: 'Developing', variant: 'error' as const };
  };

  const performanceLevel = getPerformanceLevel(attempt.overall_percentile);

  return (
    <LunaAccordionItem value={attempt.id} className="bg-white rounded-lg px-4 py-1 shadow-none">
      <LunaAccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-luna-gray-900">Cognitive Assessment</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-luna-gray-600">
                  {attempt.correct_answers}/{attempt.total_questions} Correct
                </span>
                <span className="text-xs text-luna-gray-400">•</span>
                <LunaBadge variant={performanceLevel.variant} size="sm">
                  {performanceLevel.label}
                </LunaBadge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-luna-gray-900">{attempt.overall_percentile}%</div>
            <div className="text-[10px] text-luna-gray-500">Overall Percentile</div>
          </div>
        </div>
      </LunaAccordionTrigger>

      <LunaAccordionContent>
        <div className="space-y-4 pt-3">
          {/* Domain Score KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {domains.map((domain) => (
              <LunaStatsCard
                key={domain.name}
                title={domain.name}
                value={`${domain.percentile}%`}
                description="Percentile"
                icon={<span className="text-2xl">{domain.icon}</span>}
              />
            ))}
          </div>

          {/* Domain Comparison Chart */}
          <div>
            <h5 className="text-sm font-semibold text-luna-gray-900 mb-4">Domain Performance Comparison</h5>
            <LunaChart
              type="bar"
              data={chartData}
              dataKey="name"
              series={[
                { key: 'percentile', name: 'Percentile', color: '#1449E8' }
              ]}
              height={250}
              showGrid={true}
              showLegend={false}
            />
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-green-900 mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Top Strength
              </h5>
              <p className="text-xs text-green-800 font-medium mb-0.5">{topDomain.name}</p>
              <p className="text-xs text-green-700">
                {topDomain.percentile}th percentile - {topDomain.percentile >= 75 ? 'Significantly above average' : 'Above average'} performance
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-orange-900 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Development Area
              </h5>
              <p className="text-xs text-orange-800 font-medium mb-0.5">{weakestDomain.name}</p>
              <p className="text-xs text-orange-700">
                {weakestDomain.percentile}th percentile - Opportunity for growth
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-luna-gray-50 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-luna-gray-900 mb-1.5">Recommended Roles</h5>
            <p className="text-xs text-luna-gray-700 leading-relaxed">
              {topDomain.name === 'Verbal Reasoning' && "Roles involving communication, writing, or language analysis such as content creation, editing, or customer service."}
              {topDomain.name === 'Numerical Reasoning' && "Roles requiring quantitative analysis such as data analysis, finance, accounting, or operations management."}
              {topDomain.name === 'Abstract Reasoning' && "Roles involving problem-solving and pattern recognition such as software development, engineering, or strategic planning."}
              {topDomain.name === 'Attention to Detail' && "Roles requiring precision and accuracy such as quality assurance, data entry, proofreading, or compliance."}
            </p>
          </div>

        </div>
      </LunaAccordionContent>
    </LunaAccordionItem>
  );
}

