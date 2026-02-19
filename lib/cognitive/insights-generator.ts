// =====================================================
// Cognitive Assessment - Insights Generator
// =====================================================

import type { DomainScore, CognitiveInsight, CognitiveDomain } from './types';
import { DOMAIN_CONFIGS } from './types';

/**
 * Generate insights from cognitive assessment results
 */
export function generateInsights(domainScores: DomainScore[]): CognitiveInsight[] {
  const insights: CognitiveInsight[] = [];
  
  // Sort domains by percentile
  const sortedDomains = [...domainScores].sort((a, b) => b.percentile - a.percentile);
  
  // Identify strengths (top 2 domains with percentile >= 60)
  const strengths = sortedDomains.filter(s => s.percentile >= 60).slice(0, 2);
  strengths.forEach(strength => {
    insights.push(generateStrengthInsight(strength));
  });
  
  // Identify weaknesses (bottom 2 domains with percentile < 40)
  const weaknesses = sortedDomains.filter(s => s.percentile < 40).slice(-2);
  weaknesses.forEach(weakness => {
    insights.push(generateWeaknessInsight(weakness));
  });
  
  // Generate recommendations based on profile
  insights.push(...generateRecommendations(domainScores));
  
  return insights;
}

/**
 * Generate strength insight
 */
function generateStrengthInsight(score: DomainScore): CognitiveInsight {
  const config = DOMAIN_CONFIGS[score.domain];
  
  const strengthMessages: Record<CognitiveDomain, string> = {
    verbal: `Your verbal reasoning skills are ${getPercentileDescription(score.percentile)}. You excel at understanding complex written information, making logical inferences, and working with language-based concepts. This strength is valuable for roles requiring communication, analysis, and interpretation of written materials.`,
    numerical: `Your numerical reasoning abilities are ${getPercentileDescription(score.percentile)}. You demonstrate strong skills in working with numbers, identifying patterns, and solving quantitative problems. This strength is ideal for roles involving data analysis, financial planning, or technical problem-solving.`,
    abstract: `Your abstract reasoning capabilities are ${getPercentileDescription(score.percentile)}. You excel at identifying patterns, thinking conceptually, and solving novel problems. This is a strong indicator of general intelligence and adaptability, valuable across many professional contexts.`,
    attention: `Your attention to detail is ${getPercentileDescription(score.percentile)}. You demonstrate excellent focus and accuracy when processing information. This strength is crucial for roles requiring precision, quality control, and careful execution of tasks.`
  };
  
  return {
    category: 'strength',
    domain: score.domain,
    title: `Strong ${config.title}`,
    description: strengthMessages[score.domain]
  };
}

/**
 * Generate weakness insight
 */
function generateWeaknessInsight(score: DomainScore): CognitiveInsight {
  const config = DOMAIN_CONFIGS[score.domain];
  
  const weaknessMessages: Record<CognitiveDomain, string> = {
    verbal: `Your verbal reasoning scored in the ${score.percentile}th percentile. Consider roles that rely less on extensive reading or written communication, or seek opportunities to develop these skills through practice and training.`,
    numerical: `Your numerical reasoning scored in the ${score.percentile}th percentile. You may find roles with heavy quantitative demands challenging. Consider positions that emphasize other strengths, or explore training to build confidence with numbers.`,
    abstract: `Your abstract reasoning scored in the ${score.percentile}th percentile. Complex pattern recognition may be challenging. Focus on roles with clear procedures and concrete tasks, or work on developing problem-solving strategies.`,
    attention: `Your attention to detail scored in the ${score.percentile}th percentile. Tasks requiring sustained focus on details may be challenging. Consider roles that leverage your other strengths, or implement strategies to improve concentration.`
  };
  
  return {
    category: 'weakness',
    domain: score.domain,
    title: `Developing ${config.title}`,
    description: weaknessMessages[score.domain]
  };
}

/**
 * Generate recommendations based on overall profile
 */
function generateRecommendations(domainScores: DomainScore[]): CognitiveInsight[] {
  const recommendations: CognitiveInsight[] = [];
  
  const verbal = domainScores.find(s => s.domain === 'verbal');
  const numerical = domainScores.find(s => s.domain === 'numerical');
  const abstract = domainScores.find(s => s.domain === 'abstract');
  const attention = domainScores.find(s => s.domain === 'attention');
  
  // High verbal + high numerical = analytical roles
  if (verbal && numerical && verbal.percentile >= 70 && numerical.percentile >= 70) {
    recommendations.push({
      category: 'recommendation',
      title: 'Analytical & Strategic Roles',
      description: 'Your strong verbal and numerical skills make you well-suited for analytical roles such as business analyst, consultant, or strategic planner where you can leverage both language and quantitative abilities.'
    });
  }
  
  // High abstract = problem-solving roles
  if (abstract && abstract.percentile >= 75) {
    recommendations.push({
      category: 'recommendation',
      title: 'Complex Problem-Solving',
      description: 'Your exceptional abstract reasoning suggests you would excel in roles requiring innovative thinking and complex problem-solving, such as engineering, research, or systems design.'
    });
  }
  
  // High attention = detail-oriented roles
  if (attention && attention.percentile >= 75) {
    recommendations.push({
      category: 'recommendation',
      title: 'Precision-Focused Roles',
      description: 'Your excellent attention to detail makes you ideal for roles requiring accuracy and thoroughness, such as quality assurance, auditing, editing, or technical documentation.'
    });
  }
  
  // Balanced profile
  const avgPercentile = domainScores.reduce((sum, s) => sum + s.percentile, 0) / domainScores.length;
  const variance = domainScores.reduce((sum, s) => sum + Math.pow(s.percentile - avgPercentile, 2), 0) / domainScores.length;
  
  if (variance < 100) { // Low variance = balanced
    recommendations.push({
      category: 'recommendation',
      title: 'Versatile Skill Set',
      description: 'Your balanced cognitive profile across all domains suggests versatility. You can adapt to various role types and may excel in positions requiring diverse skills and flexibility.'
    });
  }
  
  return recommendations;
}

/**
 * Get percentile description
 */
function getPercentileDescription(percentile: number): string {
  if (percentile >= 90) return 'exceptional (top 10%)';
  if (percentile >= 75) return 'strong (top 25%)';
  if (percentile >= 60) return 'above average';
  if (percentile >= 40) return 'average';
  if (percentile >= 25) return 'below average';
  return 'developing';
}

