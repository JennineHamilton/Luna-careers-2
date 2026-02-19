// =====================================================
// Cognitive Assessment - jsPsych Timeline Builder
// Client-side only - requires browser window object
// =====================================================

import { initJsPsych } from 'jspsych';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import imageButtonResponse from '@jspsych/plugin-image-button-response';
import surveyMultiChoice from '@jspsych/plugin-survey-multi-choice';
import type { CognitiveQuestion, CognitiveDomain, CognitiveResponse } from './types';
import { DOMAIN_CONFIGS } from './types';

/**
 * Initialize jsPsych instance
 */
export function createJsPsychInstance(onFinish: (data: any) => void) {
  return initJsPsych({
    on_finish: onFinish,
    show_progress_bar: true,
    auto_update_progress_bar: false,
    message_progress_bar: 'Progress'
  });
}

/**
 * Create welcome screen
 */
export function createWelcomeScreen() {
  return {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="text-center max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold mb-4">Cognitive Ability Assessment</h1>
        <p class="text-lg mb-4">
          This assessment measures your cognitive abilities across four key domains:
        </p>
        <ul class="text-left mb-6 space-y-2">
          <li>✓ <strong>Verbal Reasoning</strong> - Language and comprehension</li>
          <li>✓ <strong>Numerical Reasoning</strong> - Numbers and calculations</li>
          <li>✓ <strong>Abstract Reasoning</strong> - Patterns and logic</li>
          <li>✓ <strong>Attention to Detail</strong> - Focus and accuracy</li>
        </ul>
        <p class="mb-4">
          <strong>Duration:</strong> Approximately 15-20 minutes<br>
          <strong>Questions:</strong> 40 questions (10 per domain) + 8 practice questions
        </p>
        <p class="text-sm text-gray-600 mb-6">
          Each question has a suggested time limit shown as a countdown timer. 
          You can continue even if time runs out, but faster accurate responses 
          will result in higher scores.
        </p>
        <p class="font-semibold">Press SPACE to begin</p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 500
  };
}

/**
 * Create device check screen
 */
export function createDeviceCheckScreen() {
  return {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="text-center max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold mb-4">Device Requirements</h2>
        <p class="mb-4">
          This assessment requires a desktop or laptop computer with:
        </p>
        <ul class="text-left mb-6 space-y-2">
          <li>✓ Minimum screen width: 1024px</li>
          <li>✓ Full keyboard (not touch screen)</li>
          <li>✓ Mouse or trackpad</li>
          <li>✓ Stable internet connection</li>
        </ul>
        <p class="font-semibold">Press SPACE to continue</p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 500
  };
}

/**
 * Create domain instructions screen
 */
export function createDomainInstructions(domain: CognitiveDomain) {
  const config = DOMAIN_CONFIGS[domain];
  
  return {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="text-center max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold mb-4">${config.title}</h2>
        <p class="text-lg mb-4">${config.description}</p>
        <p class="mb-6">${config.instructions}</p>
        <p class="text-sm text-gray-600 mb-4">
          <strong>Suggested time per question:</strong> ${config.suggested_time_per_question} seconds
        </p>
        <p class="mb-4">
          You will first complete <strong>2 practice questions</strong> with immediate feedback.
        </p>
        <p class="font-semibold">Press SPACE to start practice questions</p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 500,
    data: { domain, screen_type: 'domain_instructions' }
  };
}

/**
 * Create practice question trial
 */
export function createPracticeQuestion(question: CognitiveQuestion) {
  if (question.question_type === 'multiple_choice_image' && question.question_image_url) {
    return {
      type: imageButtonResponse,
      stimulus: question.question_image_url,
      prompt: `<p class="text-lg mb-4">${question.question_text}</p>`,
      choices: question.options,
      data: {
        question_id: question.id,
        domain: question.domain,
        is_practice: true,
        correct_answer: question.correct_answer,
        suggested_time: question.suggested_time_seconds
      }
    };
  }
  
  return {
    type: surveyMultiChoice,
    questions: [
      {
        prompt: question.question_text,
        options: question.options,
        required: true,
        name: 'response'
      }
    ],
    data: {
      question_id: question.id,
      domain: question.domain,
      is_practice: true,
      correct_answer: question.correct_answer,
      suggested_time: question.suggested_time_seconds
    }
  };
}

/**
 * Create practice feedback screen
 */
export function createPracticeFeedback(question: CognitiveQuestion) {
  return {
    type: htmlKeyboardResponse,
    stimulus: function(this: any) {
      const lastTrial = this.jsPsych.data.get().last(1).values()[0];
      const userAnswer = lastTrial.response?.response || lastTrial.response;
      const isCorrect = userAnswer === question.correct_answer;

      return `
        <div class="text-center max-w-2xl mx-auto">
          <h3 class="text-xl font-bold mb-4">
            ${isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </h3>
          <p class="mb-4">
            <strong>Your answer:</strong> ${userAnswer}<br>
            <strong>Correct answer:</strong> ${question.correct_answer}
          </p>
          ${question.explanation ? `
            <div class="bg-blue-50 p-4 rounded mb-4">
              <p class="text-sm">${question.explanation}</p>
            </div>
          ` : ''}
          <p class="font-semibold">Press SPACE to continue</p>
        </div>
      `;
    },
    choices: [' '],
    post_trial_gap: 500
  };
}

/**
 * Create "ready to begin" screen after practice
 */
export function createReadyScreen(domain: CognitiveDomain) {
  const config = DOMAIN_CONFIGS[domain];

  return {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="text-center max-w-2xl mx-auto">
        <h3 class="text-xl font-bold mb-4">Ready to Begin?</h3>
        <p class="mb-4">
          You will now complete <strong>${config.real_count} ${config.title} questions</strong>.
        </p>
        <p class="mb-4">
          Unlike practice questions, you will <strong>not receive immediate feedback</strong>.
          Your results will be shown at the end of the assessment.
        </p>
        <p class="text-sm text-gray-600 mb-6">
          A countdown timer will show the suggested time for each question.
          You can continue even if time runs out.
        </p>
        <p class="font-semibold">Press SPACE when ready</p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 500,
    data: { domain, screen_type: 'ready_screen' }
  };
}

/**
 * Create real question trial (no feedback)
 */
export function createRealQuestion(question: CognitiveQuestion, onResponse: (response: CognitiveResponse) => void) {
  const baseData = {
    question_id: question.id,
    domain: question.domain,
    is_practice: false,
    correct_answer: question.correct_answer,
    suggested_time: question.suggested_time_seconds
  };

  const onFinish = (data: any) => {
    const userAnswer = data.response?.response || data.response;
    const isCorrect = userAnswer === question.correct_answer;
    const timeTaken = data.rt / 1000; // Convert ms to seconds

    onResponse({
      question_id: question.id,
      user_answer: userAnswer,
      is_correct: isCorrect,
      time_taken_seconds: timeTaken,
      is_practice: false
    });
  };

  if (question.question_type === 'multiple_choice_image' && question.question_image_url) {
    return {
      type: imageButtonResponse,
      stimulus: question.question_image_url,
      prompt: `<p class="text-lg mb-4">${question.question_text}</p>`,
      choices: question.options,
      data: baseData,
      on_finish: onFinish
    };
  }

  return {
    type: surveyMultiChoice,
    questions: [
      {
        prompt: question.question_text,
        options: question.options,
        required: true,
        name: 'response'
      }
    ],
    data: baseData,
    on_finish: onFinish
  };
}

/**
 * Create section break between domains
 */
export function createSectionBreak(completedDomain: CognitiveDomain, nextDomain: CognitiveDomain, progress: number) {
  const completedConfig = DOMAIN_CONFIGS[completedDomain];
  const nextConfig = DOMAIN_CONFIGS[nextDomain];

  return {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="text-center max-w-2xl mx-auto">
        <h3 class="text-xl font-bold mb-4">Section Complete!</h3>
        <p class="mb-4">
          You've completed the <strong>${completedConfig.title}</strong> section.
        </p>
        <div class="mb-6">
          <div class="w-full bg-gray-200 rounded-full h-4">
            <div class="bg-blue-600 h-4 rounded-full" style="width: ${progress}%"></div>
          </div>
          <p class="text-sm text-gray-600 mt-2">${progress}% Complete</p>
        </div>
        <p class="mb-4">
          <strong>Next:</strong> ${nextConfig.title}
        </p>
        <p class="text-sm text-gray-600 mb-6">
          Take a 30-second break if needed, or press SPACE to continue.
        </p>
        <p class="font-semibold">Press SPACE to continue</p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 500,
    data: { screen_type: 'section_break', completed_domain: completedDomain, next_domain: nextDomain }
  };
}

/**
 * Create completion screen
 */
export function createCompletionScreen() {
  return {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="text-center max-w-2xl mx-auto">
        <h2 class="text-3xl font-bold mb-4">Assessment Complete!</h2>
        <p class="text-lg mb-6">
          Thank you for completing the cognitive ability assessment.
        </p>
        <p class="mb-4">
          Your responses are being scored and analyzed...
        </p>
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    `,
    choices: 'NO_KEYS',
    trial_duration: 2000,
    data: { screen_type: 'completion' }
  };
}

/**
 * Build complete timeline for cognitive assessment
 */
export function buildCognitiveTimeline(
  questions: CognitiveQuestion[],
  onResponse: (response: CognitiveResponse) => void
): any[] {
  const timeline: any[] = [];

  // Welcome and device check
  timeline.push(createWelcomeScreen());
  timeline.push(createDeviceCheckScreen());

  // Process each domain in order
  const domains: CognitiveDomain[] = ['verbal', 'numerical', 'abstract', 'attention'];

  domains.forEach((domain, domainIndex) => {
    // Domain instructions
    timeline.push(createDomainInstructions(domain));

    // Practice questions
    const practiceQuestions = questions.filter(q => q.domain === domain && q.is_practice);
    practiceQuestions.forEach(question => {
      timeline.push(createPracticeQuestion(question));
      timeline.push(createPracticeFeedback(question));
    });

    // Ready screen
    timeline.push(createReadyScreen(domain));

    // Real questions
    const realQuestions = questions.filter(q => q.domain === domain && !q.is_practice);
    realQuestions.forEach(question => {
      timeline.push(createRealQuestion(question, onResponse));
    });

    // Section break (except after last domain)
    if (domainIndex < domains.length - 1) {
      const progress = ((domainIndex + 1) / domains.length) * 100;
      timeline.push(createSectionBreak(domain, domains[domainIndex + 1], progress));
    }
  });

  // Completion screen
  timeline.push(createCompletionScreen());

  return timeline;
}

