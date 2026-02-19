// =====================================================
// Cognitive Assessment - Scoring & Percentile Calculation
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { 
  CognitiveResponse, 
  DomainScore, 
  CognitiveDomain,
  CognitiveQuestion 
} from './types';
import { SCORING_WEIGHTS, SPEED_BONUS } from './types';

/**
 * Calculate raw score for a domain (0-100 percentage)
 */
export function calculateDomainRawScore(
  responses: CognitiveResponse[],
  questions: CognitiveQuestion[]
): number {
  const realResponses = responses.filter(r => !r.is_practice);
  const correctCount = realResponses.filter(r => r.is_correct).length;
  const totalCount = realResponses.length;
  
  if (totalCount === 0) return 0;
  
  return (correctCount / totalCount) * 100;
}

/**
 * Apply speed bonus to raw score
 */
export function applySpeedBonus(
  response: CognitiveResponse,
  question: CognitiveQuestion
): number {
  if (!SPEED_BONUS.enabled || !response.is_correct || !question.suggested_time_seconds) {
    return response.is_correct ? 1 : 0;
  }

  const timeThreshold = question.suggested_time_seconds * SPEED_BONUS.threshold_percentage;

  if (response.time_taken_seconds <= timeThreshold) {
    return SPEED_BONUS.multiplier; // 1.1 points instead of 1.0
  }

  return 1;
}

/**
 * Calculate speed-adjusted raw score
 */
export function calculateSpeedAdjustedScore(
  responses: CognitiveResponse[],
  questions: CognitiveQuestion[]
): number {
  const realResponses = responses.filter(r => !r.is_practice);
  
  if (realResponses.length === 0) return 0;
  
  let totalPoints = 0;
  let maxPoints = realResponses.length;
  
  realResponses.forEach(response => {
    const question = questions.find(q => q.id === response.question_id);
    if (question) {
      totalPoints += applySpeedBonus(response, question);
    }
  });
  
  // Normalize to 0-100 scale
  return (totalPoints / maxPoints) * 100;
}

/**
 * Convert raw score to percentile using ICAR norms
 */
export async function convertToPercentile(
  rawScore: number,
  domain: CognitiveDomain | 'overall'
): Promise<number> {
  const supabase = createClient();
  
  // Get norms for this domain
  const { data: norms, error } = await supabase
    .from('cognitive_norms')
    .select('*')
    .eq('domain', domain)
    .order('raw_score_percentage', { ascending: true });
  
  if (error || !norms || norms.length === 0) {
    console.error('Error fetching norms:', error);
    return 50; // Default to median if norms unavailable
  }
  
  // Find the two norms that bracket the raw score
  let lowerNorm = norms[0];
  let upperNorm = norms[norms.length - 1];
  
  for (let i = 0; i < norms.length - 1; i++) {
    if (rawScore >= norms[i].raw_score_percentage && rawScore <= norms[i + 1].raw_score_percentage) {
      lowerNorm = norms[i];
      upperNorm = norms[i + 1];
      break;
    }
  }
  
  // Linear interpolation
  if (lowerNorm.raw_score_percentage === upperNorm.raw_score_percentage) {
    return lowerNorm.percentile;
  }
  
  const scoreDiff = rawScore - lowerNorm.raw_score_percentage;
  const scoreRange = upperNorm.raw_score_percentage - lowerNorm.raw_score_percentage;
  const percentileRange = upperNorm.percentile - lowerNorm.percentile;
  
  const interpolatedPercentile = lowerNorm.percentile + (scoreDiff / scoreRange) * percentileRange;
  
  return Math.round(interpolatedPercentile);
}

/**
 * Calculate domain score with percentile
 */
export async function calculateDomainScore(
  domain: CognitiveDomain,
  responses: CognitiveResponse[],
  questions: CognitiveQuestion[]
): Promise<DomainScore> {
  const domainResponses = responses.filter(r => {
    const question = questions.find(q => q.id === r.question_id);
    return question?.domain === domain;
  });
  
  const realResponses = domainResponses.filter(r => !r.is_practice);
  const correctCount = realResponses.filter(r => r.is_correct).length;
  const totalCount = realResponses.length;
  
  // Calculate speed-adjusted raw score
  const domainQuestions = questions.filter(q => q.domain === domain);
  const rawScore = calculateSpeedAdjustedScore(domainResponses, domainQuestions);
  
  // Convert to percentile
  const percentile = await convertToPercentile(rawScore, domain);
  
  // Calculate average time
  const totalTime = realResponses.reduce((sum, r) => sum + r.time_taken_seconds, 0);
  const averageTime = totalCount > 0 ? totalTime / totalCount : 0;
  
  return {
    domain,
    raw_score: Math.round(rawScore),
    percentile,
    correct_count: correctCount,
    total_count: totalCount,
    average_time_seconds: Math.round(averageTime)
  };
}

/**
 * Calculate overall cognitive score
 */
export async function calculateOverallScore(
  domainScores: DomainScore[]
): Promise<{ raw_score: number; percentile: number }> {
  // Weighted average of domain scores
  let weightedSum = 0;
  let totalWeight = 0;
  
  domainScores.forEach(score => {
    const weight = SCORING_WEIGHTS[score.domain];
    weightedSum += score.raw_score * weight;
    totalWeight += weight;
  });
  
  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const percentile = await convertToPercentile(rawScore, 'overall');
  
  return {
    raw_score: Math.round(rawScore),
    percentile
  };
}

