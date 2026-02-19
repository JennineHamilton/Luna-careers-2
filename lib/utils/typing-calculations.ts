/**
 * Typing Test Calculations
 * WPM, Accuracy, and other metrics calculations
 */

export interface TypingMetrics {
  wpm: number;
  accuracy: number;
  correctCharacters: number;
  errorCharacters: number;
  totalCharacters: number;
  timeInSeconds: number;
}

/**
 * Calculate Words Per Minute (WPM)
 * Standard: 5 characters = 1 word
 */
export function calculateWPM(correctCharacters: number, timeInMilliseconds: number): number {
  if (timeInMilliseconds === 0) return 0;
  
  const timeInMinutes = timeInMilliseconds / 60000;
  const words = correctCharacters / 5;
  const wpm = words / timeInMinutes;
  
  return Math.round(wpm);
}

/**
 * Calculate Accuracy Percentage
 */
export function calculateAccuracy(correctCharacters: number, errorCharacters: number): number {
  const totalCharacters = correctCharacters + errorCharacters;
  
  if (totalCharacters === 0) return 100;
  
  const accuracy = (correctCharacters / totalCharacters) * 100;
  
  return Math.round(accuracy * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate all typing metrics at once
 */
export function calculateTypingMetrics(
  correctCharacters: number,
  errorCharacters: number,
  timeInMilliseconds: number
): TypingMetrics {
  return {
    wpm: calculateWPM(correctCharacters, timeInMilliseconds),
    accuracy: calculateAccuracy(correctCharacters, errorCharacters),
    correctCharacters,
    errorCharacters,
    totalCharacters: correctCharacters + errorCharacters,
    timeInSeconds: Math.round(timeInMilliseconds / 1000),
  };
}

/**
 * Calculate adjusted WPM (accounting for errors)
 * Some typing tests use this formula
 */
export function calculateAdjustedWPM(
  correctCharacters: number,
  errorCharacters: number,
  timeInMilliseconds: number
): number {
  if (timeInMilliseconds === 0) return 0;
  
  const timeInMinutes = timeInMilliseconds / 60000;
  const words = correctCharacters / 5;
  const errorWords = errorCharacters / 5;
  const adjustedWords = words - errorWords;
  const wpm = adjustedWords / timeInMinutes;
  
  return Math.max(0, Math.round(wpm)); // Never negative
}

/**
 * Format time duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format WPM for display
 */
export function formatWPM(wpm: number): string {
  return `${wpm} WPM`;
}

/**
 * Format accuracy for display
 */
export function formatAccuracy(accuracy: number): string {
  return `${accuracy.toFixed(1)}%`;
}

/**
 * Get performance category based on WPM
 */
export function getPerformanceCategory(wpm: number): {
  category: string;
  color: string;
  description: string;
} {
  if (wpm >= 81) {
    return {
      category: 'Exceptional',
      color: '#F59E0B',
      description: 'Elite typing speed',
    };
  } else if (wpm >= 61) {
    return {
      category: 'Excellent',
      color: '#8B5CF6',
      description: 'Very fast typing',
    };
  } else if (wpm >= 41) {
    return {
      category: 'Good',
      color: '#10B981',
      description: 'Above average',
    };
  } else if (wpm >= 26) {
    return {
      category: 'Average',
      color: '#3B82F6',
      description: 'Typical speed',
    };
  } else {
    return {
      category: 'Developing',
      color: '#6B7280',
      description: 'Building skills',
    };
  }
}

/**
 * Validate typing test results
 */
export function validateTypingResults(
  correctCharacters: number,
  errorCharacters: number,
  timeInMilliseconds: number
): { valid: boolean; error?: string } {
  if (correctCharacters < 0 || errorCharacters < 0) {
    return { valid: false, error: 'Character counts cannot be negative' };
  }

  if (timeInMilliseconds <= 0) {
    return { valid: false, error: 'Time must be greater than zero' };
  }

  if (correctCharacters === 0 && errorCharacters === 0) {
    return { valid: false, error: 'No characters typed' };
  }

  // Check for unrealistic WPM (over 200 is suspicious)
  const wpm = calculateWPM(correctCharacters, timeInMilliseconds);
  if (wpm > 200) {
    return { valid: false, error: 'WPM is unrealistically high' };
  }

  return { valid: true };
}

/**
 * Compare transcription text with expected text
 * Uses character-by-character comparison
 * Returns correct and error character counts
 */
export function compareTranscription(
  userInput: string,
  expectedText: string
): { correctCharacters: number; errorCharacters: number } {
  // Normalize both strings (trim and normalize whitespace)
  const normalizedUser = userInput.trim();
  const normalizedExpected = expectedText.trim();

  let correctCharacters = 0;
  let errorCharacters = 0;

  // Compare character by character up to the length of the expected text
  const maxLength = Math.max(normalizedUser.length, normalizedExpected.length);

  for (let i = 0; i < maxLength; i++) {
    const userChar = normalizedUser[i] || '';
    const expectedChar = normalizedExpected[i] || '';

    if (userChar === expectedChar) {
      correctCharacters++;
    } else {
      errorCharacters++;
    }
  }

  return { correctCharacters, errorCharacters };
}

