'use client';

import { useState, useEffect, useRef } from 'react';
import useTypingGame from 'react-typing-game-hook';
import { LunaButton } from '@/components/luna/button';
import { LunaTextarea } from '@/components/luna/textarea';
import { Clock, Zap, Target, Play, Pause } from 'lucide-react';
import { calculateTypingMetrics } from '@/lib/utils/typing-calculations';

interface TypingTestProps {
  assessmentTemplateId: string;
  passage: string;
  durationSeconds: number;
  hasAudio: boolean;
  audioUrl?: string;
  audioMimeType?: string;
  onComplete: (results: any) => void;
  onCancel: () => void;
}

export function TypingTest({
  assessmentTemplateId,
  passage,
  durationSeconds,
  hasAudio,
  audioUrl,
  audioMimeType,
  onComplete,
  onCancel,
}: TypingTestProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    states: { charsState, currIndex, correctChar, errorChar, phase },
    actions: { insertTyping, deleteTyping },
  } = useTypingGame(passage, {
    skipCurrentWordOnSpace: false,
    countErrors: 'everytime',
  });

  // Note: Auto-focus removed as LunaTextarea doesn't support ref forwarding

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  // Create attempt and start timer
  // For basic typing: when user starts typing (phase === 1)
  // For transcription: when audio starts playing (handled in toggleAudio)
  useEffect(() => {
    if (phase === 1 && !hasStarted && !hasAudio) { // PhaseType.Started = 1, only for basic typing
      startAssessment();
    }
  }, [phase, hasStarted, hasAudio]);

  const startAssessment = () => {
    if (hasStarted) return; // Prevent double start

    // Clear any existing timer first to prevent double counting
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setHasStarted(true);
    startTimeRef.current = Date.now();

    // Create the attempt record
    createAttempt();

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const createAttempt = async () => {
    try {
      const response = await fetch('/api/screening/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_template_id: assessmentTemplateId,
          passage_used: passage,
        }),
      });

      if (!response.ok) {
        console.error('Failed to create attempt');
        return;
      }

      const data = await response.json();
      setAttemptId(data.attempt_id);
    } catch (error) {
      console.error('Error creating attempt:', error);
    }
  };

  // Check for time up
  useEffect(() => {
    if (timeRemaining === 0 && hasStarted && !isSubmitting) {
      handleTimeUp();
    }
  }, [timeRemaining, hasStarted, isSubmitting]);

  // Auto-submit when passage is complete
  useEffect(() => {
    if (phase === 2 && !isSubmitting) { // PhaseType.Ended = 2
      handleSubmit();
    }
  }, [phase]);

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    handleSubmit();
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Start 3-second countdown before playing audio
      setIsCountingDown(true);
      setCountdown(3);

      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            // Countdown finished, play audio
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setIsCountingDown(false);
            setCountdown(null);

            // Play audio with error handling
            if (audioRef.current) {
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    setIsPlaying(true);
                    // For transcription assessments, start the timer when audio plays
                    if (hasAudio && !hasStarted) {
                      startAssessment();
                    }
                  })
                  .catch(error => {
                    console.error('Error playing audio:', error);
                    setIsPlaying(false);
                  });
              }
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !attemptId) {
      console.log('Cannot submit:', { isSubmitting, attemptId });
      return;
    }

    setIsSubmitting(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const timeElapsed = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : durationSeconds * 1000;

    try {
      console.log('Submitting attempt:', {
        attempt_id: attemptId,
        user_input_length: userInput.length,
        correct_characters: correctChar,
        error_characters: errorChar,
        time_in_milliseconds: timeElapsed,
      });

      const response = await fetch('/api/screening/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptId,
          user_input: userInput,
          correct_characters: correctChar,
          error_characters: errorChar,
          time_in_milliseconds: timeElapsed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Submit failed:', response.status, errorData);
        throw new Error('Failed to submit attempt');
      }

      const data = await response.json();
      console.log('Submit successful:', data);
      onComplete(data);
    } catch (error) {
      console.error('Error submitting attempt:', error);
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const oldValue = userInput;

    if (newValue.length > oldValue.length) {
      // Character added
      const addedChar = newValue[newValue.length - 1];
      insertTyping(addedChar);
    } else if (newValue.length < oldValue.length) {
      // Character deleted
      deleteTyping(false);
    }

    setUserInput(newValue);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentWPM = hasStarted && startTimeRef.current
    ? calculateTypingMetrics(correctChar, errorChar, Date.now() - startTimeRef.current).wpm
    : 0;

  const currentAccuracy = hasStarted
    ? calculateTypingMetrics(correctChar, errorChar, 1000).accuracy
    : 100;

  return (
    <>
      {/* Stats Bar */}
      <div className="bg-luna-gray-50 border-b border-luna-gray-200 px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-luna-blue" />
            <div>
              <p className="text-xs text-luna-gray-500">Time Remaining</p>
              <p className="text-lg font-semibold text-luna-gray-900">{formatTime(timeRemaining)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-luna-blue" />
            <div>
              <p className="text-xs text-luna-gray-500">WPM</p>
              <p className="text-lg font-semibold text-luna-gray-900">{currentWPM}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-luna-blue" />
            <div>
              <p className="text-xs text-luna-gray-500">Accuracy</p>
              <p className="text-lg font-semibold text-luna-gray-900">{currentAccuracy.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Display */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-sm text-luna-gray-500 mb-4">
            {hasStarted ? 'Keep typing...' : hasAudio ? 'Play the audio and start typing what you hear' : 'Start typing to begin the test'}
          </p>

          {/* Conditional: Audio Player OR Passage Text */}
          {hasAudio && audioUrl ? (
            <div className="mb-6 space-y-4">
              <div className="bg-luna-gray-50 border border-luna-gray-200 rounded-lg p-6 relative">
                {/* Countdown Overlay */}
                {isCountingDown && countdown !== null && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-10">
                    <div className="text-6xl font-bold text-white">
                      {countdown}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleAudio}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-luna-blue text-white hover:bg-luna-blue-dark transition-colors"
                    disabled={isSubmitting || isCountingDown}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-luna-gray-900">Audio Transcription</p>
                    <p className="text-xs text-luna-gray-500">
                      {isCountingDown ? 'Get ready...' : 'Listen carefully and type what you hear'}
                    </p>
                  </div>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  preload="auto"
                  crossOrigin="anonymous"
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLAudioElement;
                    console.error('Audio error details:', {
                      error: target.error,
                      code: target.error?.code,
                      message: target.error?.message,
                      url: audioUrl,
                      mimeType: audioMimeType,
                      networkState: target.networkState,
                      readyState: target.readyState,
                    });
                  }}
                  onLoadedData={() => {
                    console.log('Audio loaded successfully');
                  }}
                  onCanPlay={() => {
                    console.log('Audio can play');
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="font-mono text-lg leading-relaxed whitespace-pre-wrap mb-6">
              {passage.split('').map((char, index) => {
                let className = 'transition-colors';

                if (index < currIndex) {
                  className += charsState[index] === 1 // CharStateType.Correct = 1
                    ? ' text-green-600'
                    : ' text-red-600 bg-red-50';
                } else if (index === currIndex) {
                  className += ' bg-luna-blue text-white px-0.5';
                } else {
                  className += ' text-luna-gray-700';
                }

                return (
                  <span key={index} className={className}>
                    {char}
                  </span>
                );
              })}
            </div>
          )}

          {/* Textarea Input Field */}
          <div>
            <LunaTextarea
              label="Type here"
              placeholder="Start typing the passage above..."
              value={userInput}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={6}
              className="font-mono text-lg"
            />
            <p className="text-sm text-luna-gray-500 mt-2">
              Progress: {currIndex} / {passage.length} characters
            </p>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="border-t border-luna-gray-200 px-6 py-4 flex items-center justify-end gap-3">
        <LunaButton
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </LunaButton>
        <LunaButton
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !hasStarted}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </LunaButton>
      </div>
    </>
  );
}

