/**
 * Badge Calculator
 * Calculates skill level badges based on WPM and accuracy
 */

export interface BadgeInfo {
  level: string;
  levelNumeric: number;
  color: string;
  name: string;
  description: string;
}

export const BADGE_LEVELS = {
  1: {
    name: 'Beginner',
    color: '#6B7280',
    minWPM: 0,
    maxWPM: 25,
    description: 'Learning the basics',
  },
  2: {
    name: 'Intermediate',
    color: '#3B82F6',
    minWPM: 26,
    maxWPM: 40,
    description: 'Developing proficiency',
  },
  3: {
    name: 'Advanced',
    color: '#10B981',
    minWPM: 41,
    maxWPM: 60,
    description: 'Solid typing skills',
  },
  4: {
    name: 'Expert',
    color: '#8B5CF6',
    minWPM: 61,
    maxWPM: 80,
    description: 'Exceptional speed',
  },
  5: {
    name: 'Master',
    color: '#F59E0B',
    minWPM: 81,
    maxWPM: Infinity,
    description: 'Elite typing ability',
  },
} as const;

/**
 * Calculate skill badge based on WPM and accuracy
 */
export function calculateSkillBadge(wpm: number, accuracy: number): BadgeInfo {
  // Base level from WPM
  let baseLevel = 1;
  
  if (wpm >= 81) {
    baseLevel = 5;
  } else if (wpm >= 61) {
    baseLevel = 4;
  } else if (wpm >= 41) {
    baseLevel = 3;
  } else if (wpm >= 26) {
    baseLevel = 2;
  } else {
    baseLevel = 1;
  }
  
  // Apply accuracy modifier
  let adjustedLevel = baseLevel;
  
  if (accuracy < 70) {
    adjustedLevel = baseLevel - 1.5;
  } else if (accuracy < 80) {
    adjustedLevel = baseLevel - 1;
  } else if (accuracy < 90) {
    adjustedLevel = baseLevel - 0.5;
  }
  // 90-100% accuracy: no penalty
  
  // Round to nearest integer and clamp between 1-5
  const finalLevel = Math.max(1, Math.min(5, Math.round(adjustedLevel))) as 1 | 2 | 3 | 4 | 5;
  
  const badgeData = BADGE_LEVELS[finalLevel];
  
  return {
    level: badgeData.name.toLowerCase(),
    levelNumeric: finalLevel,
    color: badgeData.color,
    name: badgeData.name,
    description: badgeData.description,
  };
}

/**
 * Get badge info by level number
 */
export function getBadgeByLevel(levelNumeric: number): BadgeInfo {
  const level = Math.max(1, Math.min(5, levelNumeric)) as 1 | 2 | 3 | 4 | 5;
  const badgeData = BADGE_LEVELS[level];
  
  return {
    level: badgeData.name.toLowerCase(),
    levelNumeric: level,
    color: badgeData.color,
    name: badgeData.name,
    description: badgeData.description,
  };
}

/**
 * Get badge info by level name
 */
export function getBadgeByName(levelName: string): BadgeInfo | null {
  const normalized = levelName.toLowerCase();
  
  for (const [key, value] of Object.entries(BADGE_LEVELS)) {
    if (value.name.toLowerCase() === normalized) {
      return {
        level: normalized,
        levelNumeric: parseInt(key),
        color: value.color,
        name: value.name,
        description: value.description,
      };
    }
  }
  
  return null;
}

/**
 * Compare two badges and determine if there's an improvement
 */
export function compareBadges(
  current: BadgeInfo,
  previous: BadgeInfo
): {
  improved: boolean;
  levelChange: number;
  message: string;
} {
  const levelChange = current.levelNumeric - previous.levelNumeric;
  
  if (levelChange > 0) {
    return {
      improved: true,
      levelChange,
      message: `Congratulations! You've advanced from ${previous.name} to ${current.name}!`,
    };
  } else if (levelChange < 0) {
    return {
      improved: false,
      levelChange,
      message: `Your level decreased from ${previous.name} to ${current.name}. Keep practicing!`,
    };
  } else {
    return {
      improved: false,
      levelChange: 0,
      message: `You maintained your ${current.name} level.`,
    };
  }
}

/**
 * Get all badge levels for display
 */
export function getAllBadgeLevels(): BadgeInfo[] {
  return Object.entries(BADGE_LEVELS).map(([key, value]) => ({
    level: value.name.toLowerCase(),
    levelNumeric: parseInt(key),
    color: value.color,
    name: value.name,
    description: value.description,
  }));
}

/**
 * Get WPM range for a badge level
 */
export function getWPMRangeForLevel(levelNumeric: number): { min: number; max: number } {
  const level = Math.max(1, Math.min(5, levelNumeric)) as 1 | 2 | 3 | 4 | 5;
  const badgeData = BADGE_LEVELS[level];
  
  return {
    min: badgeData.minWPM,
    max: badgeData.maxWPM === Infinity ? 999 : badgeData.maxWPM,
  };
}

