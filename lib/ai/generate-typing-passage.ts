/**
 * Generate Typing Passage using Together.AI
 * Creates unique, dynamic passages for typing tests
 */

const TOGETHER_AI_API_KEY = process.env.TOGETHER_AI_API_KEY || 'tgp_v1_wHXRjlsEJmUQxLjny1jaJ4RmmZcxnZ18ucB5gU96ofQ';
const TOGETHER_AI_MODEL = process.env.TOGETHER_AI_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';

export interface GeneratePassageOptions {
  language?: string;
  wordCount?: number;
  customPrompt?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Generate a typing test passage using Together.AI
 */
export async function generateTypingPassage(options: GeneratePassageOptions = {}): Promise<string> {
  const {
    language = 'en',
    wordCount = 70,
    customPrompt,
    difficulty = 'medium',
  } = options;

  // Build the prompt based on options
  let userPrompt = customPrompt;
  
  if (!userPrompt) {
    const difficultyInstructions = {
      easy: 'Use very simple, common words. Short sentences. Topics like daily life, weather, or basic activities.',
      medium: 'Use everyday English words. Mix of short and medium sentences. Topics like work, communication, or hobbies.',
      hard: 'Use varied vocabulary including some professional terms. Complex sentence structures. Topics like business, technology, or current events.',
    };

    const languageInstructions: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      pt: 'Portuguese',
    };

    const languageName = languageInstructions[language] || 'English';

    userPrompt = `Generate a typing test passage in ${languageName} with exactly ${wordCount}-${wordCount + 10} words.

${difficultyInstructions[difficulty]}

Requirements:
- Use proper grammar and punctuation
- Make it engaging and natural
- Avoid repetitive words
- Include a mix of common punctuation (periods, commas)
- Write about relatable, professional topics
- Only output the passage text, nothing else
- Do not include quotes, titles, or any meta-commentary`;
  }

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
            content: 'You are a helpful assistant that generates typing test passages. Only respond with the passage text, no additional commentary, quotes, or formatting.',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.8, // Higher temperature for more variety
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Together.AI API Error:', error);
      throw new Error(`Failed to generate passage: ${response.status}`);
    }

    const data = await response.json();
    let passage = data.choices[0].message.content.trim();

    // Clean up the passage
    passage = passage
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^\*\*.*?\*\*\s*/g, '') // Remove markdown bold titles
      .replace(/^#.*?\n/g, '') // Remove markdown headers
      .trim();

    // Validate passage length
    const actualWordCount = passage.split(/\s+/).length;
    if (actualWordCount < 30) {
      throw new Error('Generated passage is too short');
    }

    return passage;
  } catch (error) {
    console.error('Error generating typing passage:', error);
    
    // Fallback passage if AI fails
    const fallbackPassages: Record<string, string> = {
      en: 'The quick brown fox jumps over the lazy dog. Communication is key in any workplace. Good typing skills help you work faster and more efficiently. Practice makes perfect when learning new skills. Stay focused and keep improving every day.',
      es: 'La comunicación es fundamental en cualquier lugar de trabajo. Las buenas habilidades de mecanografía te ayudan a trabajar más rápido. La práctica hace al maestro cuando aprendes nuevas habilidades.',
      fr: 'La communication est essentielle dans tout lieu de travail. De bonnes compétences en dactylographie vous aident à travailler plus rapidement. La pratique rend parfait lors de l\'apprentissage de nouvelles compétences.',
    };

    return fallbackPassages[language] || fallbackPassages.en;
  }
}

/**
 * Generate multiple passages at once (for pre-caching)
 */
export async function generateMultiplePassages(
  count: number,
  options: GeneratePassageOptions = {}
): Promise<string[]> {
  const promises = Array.from({ length: count }, () => generateTypingPassage(options));
  return Promise.all(promises);
}

