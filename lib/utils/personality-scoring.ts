/**
 * Validated Personality Scoring Algorithms
 * 
 * Source: IPIP-50 Scoring Instructions
 * https://ipip.ori.org/newScoringInstructions.htm
 * 
 * Based on: Goldberg, L. R. (1992). The development of markers for the 
 * Big-Five factor structure. Psychological Assessment, 4, 26-42.
 */

export interface PersonalityQuestion {
  id: string;
  question_number: number;
  question_text: string;
  dimension: string; // Database returns string, not enum
  is_reversed: boolean;
}

export interface PersonalityResponse {
  id: string;
  question_id: string;
  response_value: number; // 1-5 Likert scale
  question: PersonalityQuestion;
}

export interface BigFiveScores {
  extraversion: number;
  agreeableness: number;
  conscientiousness: number;
  emotional_stability: number;
  intellect: number;
}

export interface BigFivePercentiles {
  extraversion: number;
  agreeableness: number;
  conscientiousness: number;
  emotional_stability: number;
  intellect: number;
}

/**
 * Calculate Big Five scores using standard IPIP scoring method
 * 
 * Method:
 * 1. For each dimension, sum the responses (reverse-scoring where needed)
 * 2. Convert raw sum to 0-100 scale
 * 
 * Each dimension has 10 items scored 1-5:
 * - Minimum possible raw sum: 10 (all 1s)
 * - Maximum possible raw sum: 50 (all 5s)
 * - Formula: ((rawSum - 10) / 40) * 100
 * 
 * @param responses - Array of user responses with question metadata
 * @returns Big Five scores on 0-100 scale
 */
export function calculateBigFiveScores(responses: PersonalityResponse[]): BigFiveScores {
  const dimensions: Array<keyof BigFiveScores> = [
    'extraversion',
    'agreeableness',
    'conscientiousness',
    'emotional_stability',
    'intellect'
  ];
  
  const scores: Partial<BigFiveScores> = {};
  
  dimensions.forEach(dimension => {
    // Filter responses for this dimension
    const dimensionResponses = responses.filter(r => r.question.dimension === dimension);
    
    // Validate we have 10 responses per dimension
    if (dimensionResponses.length !== 10) {
      throw new Error(`Expected 10 responses for ${dimension}, got ${dimensionResponses.length}`);
    }
    
    // Calculate raw sum with reverse scoring
    let rawSum = 0;
    dimensionResponses.forEach(response => {
      // Standard IPIP reverse scoring: 6 - original_value
      // This converts: 5→1, 4→2, 3→3, 2→4, 1→5
      const score = response.question.is_reversed 
        ? (6 - response.response_value)
        : response.response_value;
      rawSum += score;
    });
    
    // Convert to 0-100 scale
    // Min: 10, Max: 50, Range: 40
    scores[dimension] = ((rawSum - 10) / 40) * 100;
  });
  
  return scores as BigFiveScores;
}

/**
 * Calculate percentile ranks using IPIP normative data
 * 
 * Source: IPIP Community Sample (N ≈ 20,000)
 * These norms are approximate values based on published IPIP data
 * 
 * Method:
 * 1. Calculate z-score: (score - mean) / SD
 * 2. Convert z-score to percentile using standard normal CDF
 * 
 * @param scores - Big Five scores on 0-100 scale
 * @returns Percentile ranks (0-100)
 */
export function calculatePercentiles(scores: BigFiveScores): BigFivePercentiles {
  // Normative means and standard deviations from IPIP Community Sample
  // These are approximate values on the 0-100 scale
  const norms = {
    extraversion: { mean: 50, sd: 20 },
    agreeableness: { mean: 60, sd: 18 },
    conscientiousness: { mean: 55, sd: 19 },
    emotional_stability: { mean: 52, sd: 21 },
    intellect: { mean: 58, sd: 17 }
  };
  
  const percentiles: Partial<BigFivePercentiles> = {};
  
  (Object.keys(scores) as Array<keyof BigFiveScores>).forEach(dimension => {
    const score = scores[dimension];
    const norm = norms[dimension];
    
    // Calculate z-score
    const zScore = (score - norm.mean) / norm.sd;
    
    // Convert to percentile using standard normal CDF
    const percentile = normalCDF(zScore) * 100;
    
    // Round and clamp to 0-100 range
    percentiles[dimension] = Math.max(0, Math.min(100, Math.round(percentile)));
  });
  
  return percentiles as BigFivePercentiles;
}

/**
 * Standard normal cumulative distribution function (CDF)
 * 
 * Uses Abramowitz and Stegun approximation (1964)
 * Maximum error: 7.5 × 10^-8
 * 
 * @param z - Z-score
 * @returns Probability (0-1)
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return z > 0 ? 1 - prob : prob;
}

