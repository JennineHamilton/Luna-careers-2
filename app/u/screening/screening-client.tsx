'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Clock, 
  Search,
  Target,
  Brain,
  Users,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { TakeAssessmentModal } from '@/components/assessment/take-assessment-modal';
import { ResultsModal } from '@/components/assessment/results-modal';
import { KnowledgeResultsModal } from '@/components/assessment/knowledge-results-modal';
import { PersonalityAssessmentModal } from '@/components/assessment/personality-assessment-modal';
import { TakeKnowledgeAssessmentModal } from '@/components/assessment/take-knowledge-assessment-modal';
import type { Database } from '@/types/database.types';
import { cn } from '@/lib/utils';

const CognitiveAssessmentModal = dynamic(
  () => import('@/components/assessment/cognitive-assessment-modal').then(mod => {
    return { default: mod.CognitiveAssessmentModal };
  }),
  { ssr: false, loading: () => <div>Loading...</div> }
);

type AssessmentTemplate = Database['public']['Tables']['assessment_templates']['Row'];
type KnowledgeAssessment = Database['public']['Tables']['knowledge_assessments']['Row'];
type UserSkillBadge = Database['public']['Tables']['user_skill_badges']['Row'] & {
  assessment_template?: AssessmentTemplate | null;
};

interface ScreeningClientProps {
  assessments: AssessmentTemplate[];
  knowledgeAssessments: KnowledgeAssessment[];
  badges: UserSkillBadge[];
  attemptsByAssessment: Record<string, number>;
  knowledgeAttemptsByAssessment: Record<string, { id: string; score: number; passed: boolean }>;
  personalityAttemptsByAssessment: Record<string, { id: string; averageScore: number }>;
  cognitiveAttemptsByAssessment: Record<string, { id: string; score: number; percentile: number }>;
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORY STYLES - Bright, distinct colors
═══════════════════════════════════════════════════════════════ */
const CATEGORIES: Record<string, { 
  label: string; 
  bg: string; 
  text: string; 
  border: string;
  icon: React.ElementType;
}> = {
  aptitude: { 
    label: 'Aptitude', 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    border: 'border-amber-300',
    icon: Target 
  },
  personality: { 
    label: 'Personality', 
    bg: 'bg-teal-50', 
    text: 'text-teal-700', 
    border: 'border-teal-300',
    icon: Users 
  },
  cognitive: { 
    label: 'Cognitive', 
    bg: 'bg-violet-50', 
    text: 'text-violet-700', 
    border: 'border-violet-300',
    icon: Brain 
  },
  skills: { 
    label: 'Skills', 
    bg: 'bg-fuchsia-50', 
    text: 'text-fuchsia-700', 
    border: 'border-fuchsia-300',
    icon: Sparkles 
  },
  knowledge: { 
    label: 'Knowledge', 
    bg: 'bg-fuchsia-50', 
    text: 'text-fuchsia-700', 
    border: 'border-fuchsia-300',
    icon: BookOpen 
  },
  emotional: { 
    label: 'Emotional Intelligence', 
    bg: 'bg-rose-50', 
    text: 'text-rose-600', 
    border: 'border-rose-300',
    icon: Sparkles 
  },
  risk: { 
    label: 'Risk', 
    bg: 'bg-red-50', 
    text: 'text-red-600', 
    border: 'border-red-300',
    icon: Target 
  },
};

const FILTER_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'aptitude', label: 'Aptitude' },
  { id: 'personality', label: 'Personality' },
  { id: 'cognitive', label: 'Cognitive' },
  { id: 'skills', label: 'Skills' },
  { id: 'emotional', label: 'Emotional Intelligence' },
];

export function ScreeningClient({
  assessments,
  knowledgeAssessments,
  badges,
  attemptsByAssessment,
  knowledgeAttemptsByAssessment,
  personalityAttemptsByAssessment,
  cognitiveAttemptsByAssessment,
}: ScreeningClientProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentTemplate | null>(null);

  // When opening from a prerequisite link (?assessment=id), filter to that assessment
  useEffect(() => {
    const assessmentId = searchParams.get('assessment');
    if (!assessmentId) return;
    const template = assessments.find((a) => a.id === assessmentId);
    if (template) {
      setActiveFilter(getCategory(template));
      setSearchQuery(template.title);
      return;
    }
    const knowledge = knowledgeAssessments.find((a) => a.id === assessmentId);
    if (knowledge) {
      setActiveFilter('skills');
      setSearchQuery(knowledge.title);
    }
  }, [searchParams, assessments, knowledgeAssessments]);
  const [selectedKnowledgeAssessment, setSelectedKnowledgeAssessment] = useState<KnowledgeAssessment | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [knowledgeResultsModalOpen, setKnowledgeResultsModalOpen] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState<Record<string, unknown> | null>(null);
  const [currentKnowledgeAttempt, setCurrentKnowledgeAttempt] = useState<Record<string, unknown> | null>(null);
  const [personalityModalOpen, setPersonalityModalOpen] = useState(false);
  const [cognitiveModalOpen, setCognitiveModalOpen] = useState(false);

  // Map assessment to category
  const getCategory = (assessment: AssessmentTemplate): string => {
    if (assessment.category === 'personality') return 'personality';
    if (assessment.category === 'cognitive') return 'cognitive';
    if (assessment.assessment_type === 'soft_skills') return 'emotional';
    return 'aptitude';
  };

  // Filter logic
  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      searchQuery === '' ||
      assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const category = getCategory(assessment);
    const matchesFilter = 
      activeFilter === 'all' ||
      activeFilter === category ||
      (activeFilter === 'skills' && category === 'knowledge');

    return matchesSearch && matchesFilter;
  });

  const filteredKnowledgeAssessments = knowledgeAssessments.filter((assessment) => {
    const matchesSearch =
      searchQuery === '' ||
      assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = activeFilter === 'all' || activeFilter === 'skills';
    return matchesSearch && matchesFilter;
  });

  // Handlers
  const handleTakeAssessment = (assessment: AssessmentTemplate) => {
    setSelectedAssessment(assessment);
    if (assessment.category === 'personality') {
      setPersonalityModalOpen(true);
    } else if (assessment.category === 'cognitive') {
      setCognitiveModalOpen(true);
    } else {
      setTestModalOpen(true);
    }
  };

  const handleTakeKnowledgeAssessment = (assessment: KnowledgeAssessment) => {
    setSelectedKnowledgeAssessment(assessment);
    setKnowledgeModalOpen(true);
  };

  const handleTestComplete = (attemptData: Record<string, unknown>) => {
    setCurrentAttempt(attemptData);
    setTestModalOpen(false);
    setResultsModalOpen(true);
  };

  const handleKnowledgeTestComplete = (attemptData: Record<string, unknown>) => {
    setCurrentKnowledgeAttempt(attemptData);
    setKnowledgeModalOpen(false);
    setKnowledgeResultsModalOpen(true);
  };

  const handleRetake = () => {
    setResultsModalOpen(false);
    setTestModalOpen(true);
  };

  const handleKnowledgeRetake = () => {
    setKnowledgeResultsModalOpen(false);
    setKnowledgeModalOpen(true);
  };

  const handleClose = () => {
    setResultsModalOpen(false);
    setSelectedAssessment(null);
    setCurrentAttempt(null);
  };

  const handleKnowledgeClose = () => {
    setKnowledgeResultsModalOpen(false);
    setSelectedKnowledgeAssessment(null);
    setCurrentKnowledgeAttempt(null);
  };

  const totalCount = filteredAssessments.length + filteredKnowledgeAssessments.length;

  return (
    <div className="pb-8">
      {/* Main Container */}
      <div className="bg-white rounded-[10px] border border-luna-border-default">
        {/* Header */}
        <div className="p-5 border-b border-luna-gray-100">
          <h1 className="text-2xl font-bold text-luna-gray-900 mb-1">
            Pre-Screening Assessments
          </h1>
          <p className="text-sm text-luna-gray-600">
            Identify your strengths with job-relevant assessments. Complete as many as possible 
            to build a comprehensive profile that showcases your capabilities to employers.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="p-5 border-b border-luna-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luna-gray-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-luna-gray-200 text-sm text-luna-gray-900 placeholder:text-luna-gray-400 focus:outline-none focus:border-luna-gray-400 focus:ring-2 focus:ring-luna-gray-100 transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {FILTER_PILLS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                    activeFilter === filter.id
                      ? "bg-luna-navy text-white"
                      : "bg-luna-gray-100 text-luna-gray-600 hover:bg-luna-gray-200"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-5 py-3 border-b border-luna-gray-50">
          <span className="text-sm text-luna-gray-500">{totalCount} assessments</span>
        </div>

        {/* Cards Grid */}
        <div className="p-5">
          {totalCount === 0 ? (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-luna-gray-300 mx-auto mb-3" />
              <p className="text-luna-gray-500">No assessments found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {/* Knowledge Assessments */}
              {filteredKnowledgeAssessments.map((assessment) => {
                const attemptData = knowledgeAttemptsByAssessment[assessment.id];
                const hasTaken = !!attemptData;
                return (
                  <AssessmentCard
                    key={`k-${assessment.id}`}
                    title={assessment.title}
                    description={assessment.description || 'Test your knowledge'}
                    duration={`${assessment.time_limit_minutes} minutes`}
                    category="knowledge"
                    hasTaken={hasTaken}
                    score={attemptData ? attemptData.score : undefined}
                    passed={attemptData ? attemptData.passed : undefined}
                    onTake={() => handleTakeKnowledgeAssessment(assessment)}
                  />
                );
              })}

              {/* Regular Assessments */}
              {filteredAssessments.map((assessment) => {
                const category = getCategory(assessment);
                const badge = badges.find(b => b.assessment_template_id === assessment.id);
                const personalityAttempt = personalityAttemptsByAssessment[assessment.id];
                const cognitiveAttempt = cognitiveAttemptsByAssessment[assessment.id];

                const hasTaken = !!badge ||
                                 !!personalityAttempt ||
                                 !!cognitiveAttempt ||
                                 (attemptsByAssessment[assessment.id] || 0) > 0;

                // Determine score display based on assessment type
                let scoreDisplay: string | undefined;
                let passed: boolean | undefined;

                if (badge) {
                  // Typing assessment - show WPM only
                  scoreDisplay = `${badge.best_wpm || 0} WPM`;
                } else if (personalityAttempt) {
                  // Personality assessment - show average score
                  scoreDisplay = `${personalityAttempt.averageScore}/100`;
                } else if (cognitiveAttempt) {
                  // Cognitive assessment - show percentile
                  scoreDisplay = `${Math.round(cognitiveAttempt.score)}% (${Math.round(cognitiveAttempt.percentile)}th percentile)`;
                }

                return (
                  <AssessmentCard
                    key={assessment.id}
                    title={assessment.title}
                    description={assessment.description || 'Test your skills'}
                    duration={`${Math.ceil(assessment.duration_seconds / 60)} minutes`}
                    category={category}
                    hasTaken={hasTaken}
                    scoreDisplay={scoreDisplay}
                    passed={passed}
                    isPersonality={category === 'personality'}
                    onTake={() => handleTakeAssessment(assessment)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TakeAssessmentModal
        open={testModalOpen}
        onClose={() => { setTestModalOpen(false); setSelectedAssessment(null); }}
        assessment={selectedAssessment}
        onComplete={handleTestComplete}
      />
      <ResultsModal
        open={resultsModalOpen}
        onClose={handleClose}
        attemptData={currentAttempt}
        onRetake={handleRetake}
      />
      <PersonalityAssessmentModal
        open={personalityModalOpen}
        onClose={() => { setPersonalityModalOpen(false); setSelectedAssessment(null); }}
        onComplete={() => { setPersonalityModalOpen(false); setSelectedAssessment(null); }}
      />
      <CognitiveAssessmentModal
        open={cognitiveModalOpen}
        onClose={() => { setCognitiveModalOpen(false); setSelectedAssessment(null); }}
        onComplete={() => { setCognitiveModalOpen(false); setSelectedAssessment(null); }}
      />
      <TakeKnowledgeAssessmentModal
        open={knowledgeModalOpen}
        onClose={() => { setKnowledgeModalOpen(false); setSelectedKnowledgeAssessment(null); }}
        assessment={selectedKnowledgeAssessment}
        onComplete={handleKnowledgeTestComplete}
      />
      <KnowledgeResultsModal
        open={knowledgeResultsModalOpen}
        onClose={handleKnowledgeClose}
        attemptData={currentKnowledgeAttempt}
        onRetake={handleKnowledgeRetake}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ASSESSMENT CARD - Clean, sophisticated design
═══════════════════════════════════════════════════════════════ */
function AssessmentCard({
  title,
  description,
  duration,
  category,
  hasTaken,
  score,
  scoreDisplay,
  passed,
  isPersonality,
  onTake,
}: {
  title: string;
  description: string;
  duration: string;
  category: string;
  hasTaken: boolean;
  score?: number;
  scoreDisplay?: string;
  passed?: boolean;
  isPersonality?: boolean;
  onTake: () => void;
}) {
  const style = CATEGORIES[category] || CATEGORIES.aptitude;

  return (
    <div className="group bg-white border border-luna-gray-200 rounded-[10px] p-5 hover:shadow-sm hover:border-luna-gray-300 transition-all duration-200 flex flex-col h-full">
      {/* Top Row: Category + Duration */}
      <div className="flex items-center justify-between mb-4">
        <span className={cn(
          "px-3 py-1 rounded-md text-xs font-semibold",
          style.bg,
          style.text
        )}>
          {style.label}
        </span>
        <div className="flex items-center gap-1.5 text-luna-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs">{duration}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-luna-gray-900 mb-2 leading-snug">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-luna-gray-500 leading-relaxed mb-5 grow line-clamp-3">
        {description}
      </p>

      {/* Bottom Row: Button + Score */}
      <div className="flex items-center justify-between">
        {/* Action Button */}
        <button
          onClick={onTake}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium border transition-all",
            "bg-white hover:bg-luna-gray-50",
            style.border,
            style.text
          )}
        >
          {hasTaken ? (isPersonality ? 'Retake Assessment' : 'Retake Assessment') : 'Take Assessment'}
        </button>

        {/* Score Display */}
        {hasTaken && (scoreDisplay || score !== undefined) && (
          <div className={cn("text-sm font-semibold px-3 py-1.5 rounded-md", style.bg, style.text)}>
            {scoreDisplay || `${score}%`}
          </div>
        )}
      </div>
    </div>
  );
}
