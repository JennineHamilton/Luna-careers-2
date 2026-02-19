// =====================================================
// Cognitive Assessment - TypeScript Types
// =====================================================

export type CognitiveDomain = 'verbal' | 'numerical' | 'abstract' | 'attention';

export type QuestionType = 
  | 'multiple_choice_text' 
  | 'multiple_choice_image' 
  | 'pattern_match' 
  | 'number_sequence';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface CognitiveQuestion {
  id: string;
  template_id: string | null;
  domain: string;
  question_type: string;
  question_text: string | null;
  question_image_url?: string | null;
  options: any; // Json type from database
  correct_answer: string;
  suggested_time_seconds: number | null;
  difficulty_level: string | null;
  icar_item_id?: string | null;
  is_practice: boolean | null;
  display_order: number | null;
  explanation?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CognitiveResponse {
  id?: string;
  attempt_id?: string | null;
  question_id: string | null;
  user_answer: string;
  is_correct: boolean;
  time_taken_seconds: number;
  is_practice: boolean | null;
  responded_at?: string | null;
}

export interface DomainScore {
  domain: CognitiveDomain;
  raw_score: number; // 0-100 percentage
  percentile: number; // 1-99
  correct_count: number;
  total_count: number;
  average_time_seconds: number;
}

export interface CognitiveAttempt {
  id: string;
  user_id: string;
  template_id: string;
  started_at: string;
  completed_at?: string;
  overall_score?: number;
  overall_percentile?: number;
  verbal_score?: number;
  verbal_percentile?: number;
  numerical_score?: number;
  numerical_percentile?: number;
  abstract_score?: number;
  abstract_percentile?: number;
  attention_score?: number;
  attention_percentile?: number;
  total_time_seconds?: number;
}

export interface CognitiveInsight {
  category: 'strength' | 'weakness' | 'recommendation';
  domain?: CognitiveDomain;
  title: string;
  description: string;
}

export interface CognitiveResults {
  attempt: CognitiveAttempt;
  domain_scores: DomainScore[];
  insights: CognitiveInsight[];
  responses: CognitiveResponse[];
}

// jsPsych trial data
export interface JsPsychTrialData {
  rt: number; // reaction time in milliseconds
  response: string;
  correct?: boolean;
  question_id?: string;
  domain?: CognitiveDomain;
  is_practice?: boolean;
}

// Domain configuration
export interface DomainConfig {
  domain: CognitiveDomain;
  title: string;
  description: string;
  icon: string;
  suggested_time_per_question: number;
  practice_count: number;
  real_count: number;
  instructions: string;
}

export const DOMAIN_CONFIGS: Record<CognitiveDomain, DomainConfig> = {
  verbal: {
    domain: 'verbal',
    title: 'Verbal Reasoning',
    description: 'Reading comprehension, vocabulary, and logical inference',
    icon: 'BookOpen',
    suggested_time_per_question: 45,
    practice_count: 2,
    real_count: 10,
    instructions: 'You will be presented with verbal reasoning questions including analogies, vocabulary, and reading comprehension. Read each question carefully and select the best answer.'
  },
  numerical: {
    domain: 'numerical',
    title: 'Numerical Reasoning',
    description: 'Number patterns, calculations, and data interpretation',
    icon: 'Calculator',
    suggested_time_per_question: 60,
    practice_count: 2,
    real_count: 10,
    instructions: 'You will be presented with numerical reasoning questions including number sequences, basic calculations, and data interpretation. Take your time to work through each problem.'
  },
  abstract: {
    domain: 'abstract',
    title: 'Abstract Reasoning',
    description: 'Pattern recognition and spatial reasoning',
    icon: 'Grid3x3',
    suggested_time_per_question: 90,
    practice_count: 2,
    real_count: 10,
    instructions: 'You will be presented with visual patterns and matrices. Identify the underlying pattern and select the option that best completes the sequence.'
  },
  attention: {
    domain: 'attention',
    title: 'Attention to Detail',
    description: 'Error detection and instruction following',
    icon: 'Eye',
    suggested_time_per_question: 30,
    practice_count: 2,
    real_count: 10,
    instructions: 'You will be presented with tasks that require careful attention to detail. Look closely and identify differences, errors, or follow specific instructions.'
  }
};

// Scoring weights
export const SCORING_WEIGHTS = {
  verbal: 0.25,
  numerical: 0.25,
  abstract: 0.30, // Weighted higher (best predictor of general intelligence)
  attention: 0.20
};

// Speed bonus configuration
export const SPEED_BONUS = {
  enabled: true,
  multiplier: 1.1, // 10% bonus for fast accurate responses
  threshold_percentage: 0.8 // Must complete within 80% of suggested time
};

