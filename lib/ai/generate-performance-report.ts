/**
 * Generate Performance Report using Together.AI
 * Creates personalized, encouraging feedback for typing test results
 */

const TOGETHER_AI_API_KEY = process.env.TOGETHER_AI_API_KEY || 'tgp_v1_wHXRjlsEJmUQxLjny1jaJ4RmmZcxnZ18ucB5gU96ofQ';
const TOGETHER_AI_MODEL = process.env.TOGETHER_AI_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';

export interface PerformanceData {
  wpm: number;
  accuracy: number;
  timeInSeconds: number;
  skillLevel: string;
  skillLevelNumeric: number;
  assessmentType?: string;
  language?: string;
}

/**
 * Generate a personalized performance report using Together.AI
 */
export async function generatePerformanceReport(data: PerformanceData): Promise<string> {
  const {
    wpm,
    accuracy,
    timeInSeconds,
    skillLevel,
    skillLevelNumeric,
    assessmentType = 'typing',
    language = 'English',
  } = data;

  const prompt = `Generate a short, professional performance report for a typing test result.

Test Results:
- Speed: ${wpm} WPM (words per minute)
- Accuracy: ${accuracy}%
- Time: ${timeInSeconds} seconds
- Skill Level: ${skillLevel} (Level ${skillLevelNumeric}/5)
- Test Type: ${assessmentType}
- Language: ${language}

Requirements:
- Write 2-3 sentences maximum
- Be encouraging and professional
- Mention the WPM, accuracy, and skill level
- Provide context about what this level means for job readiness
- Use proper grammar and punctuation
- Be specific to their performance
- End with a brief note about their skill level's suitability for professional work

Example format: "You typed X WPM with Y% accuracy in Z seconds. You are a [skill level] typist with [description of abilities]. [Context about job readiness]."

Only output the report text, nothing else.`;

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TOGETHER_AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional career coach providing constructive feedback on typing test performance. Be encouraging, specific, and professional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Together.AI API Error:', error);
      throw new Error(`Failed to generate report: ${response.status}`);
    }

    const responseData = await response.json();
    let report = responseData.choices[0].message.content.trim();

    // Clean up the report
    report = report
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^\*\*.*?\*\*\s*/g, '') // Remove markdown bold
      .trim();

    return report;
  } catch (error) {
    console.error('Error generating performance report:', error);
    
    // Fallback to template-based report
    return generateFallbackReport(data);
  }
}

/**
 * Generate a fallback report using templates (if AI fails)
 */
function generateFallbackReport(data: PerformanceData): string {
  const { wpm, accuracy, timeInSeconds, skillLevel, skillLevelNumeric } = data;

  const levelDescriptions: Record<string, string> = {
    beginner: 'developing your typing foundation',
    intermediate: 'building solid typing proficiency',
    advanced: 'demonstrating strong typing capabilities',
    expert: 'showing exceptional typing mastery',
    master: 'achieving elite-level typing performance',
  };

  const jobReadiness: Record<number, string> = {
    1: 'With continued practice, you\'ll be ready for entry-level positions requiring basic typing.',
    2: 'Your skills are suitable for most administrative and office support roles.',
    3: 'You have the typing speed needed for professional roles including customer service and data entry.',
    4: 'Your exceptional speed qualifies you for high-volume typing positions and executive support roles.',
    5: 'Your elite typing ability makes you an ideal candidate for transcription, court reporting, and other speed-critical positions.',
  };

  const description = levelDescriptions[skillLevel.toLowerCase()] || 'developing your skills';
  const readiness = jobReadiness[skillLevelNumeric] || 'Keep practicing to improve your professional readiness.';

  return `You typed ${wpm} WPM with ${accuracy}% accuracy in ${timeInSeconds} seconds. You are a ${skillLevel} typist ${description}. ${readiness}`;
}

/**
 * Generate a comparative report (comparing to previous attempts)
 */
export async function generateComparativeReport(
  current: PerformanceData,
  previous: PerformanceData
): Promise<string> {
  const wpmChange = current.wpm - previous.wpm;
  const accuracyChange = current.accuracy - previous.accuracy;
  const improvement = wpmChange > 0 || accuracyChange > 0;

  const prompt = `Generate a short performance comparison report.

Current Test:
- Speed: ${current.wpm} WPM
- Accuracy: ${current.accuracy}%

Previous Best:
- Speed: ${previous.wpm} WPM
- Accuracy: ${previous.accuracy}%

Changes:
- WPM: ${wpmChange > 0 ? '+' : ''}${wpmChange}
- Accuracy: ${accuracyChange > 0 ? '+' : ''}${accuracyChange.toFixed(1)}%

Write 2 sentences acknowledging their ${improvement ? 'improvement' : 'performance'} and encouraging them. Be professional and motivating.

Only output the report text, nothing else.`;

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TOGETHER_AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a supportive career coach providing feedback on progress.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate comparative report: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Error generating comparative report:', error);
    
    if (improvement) {
      return `Great progress! You've improved by ${wpmChange} WPM. Keep up the excellent work!`;
    } else {
      return `Your performance remains consistent. Keep practicing to see continued improvement!`;
    }
  }
}

