'use client';

import { useEffect, useRef } from 'react';

export interface ScormData {
  score_raw?: number;
  score_min?: number;
  score_max?: number;
  passing_score?: number;
  success_status?: string;
  completion_status?: string;
  quiz_attempts?: number;
  cmi_data?: Record<string, string>;
}

interface ScormApiAdapterProps {
  lessonId: string;
  userId: string;
  moduleId: string;
  isQuiz?: boolean; // Whether this lesson is a quiz
  passingScore?: number; // Passing score threshold (0-100)
  onScormComplete?: (scormData: ScormData) => void; // Called when SCORM content reports completion (enables button)
  onProgressUpdate?: (progress: number) => void;
}

/**
 * SCORM API Adapter
 * Provides window.API (SCORM 1.2) and window.API_1484_11 (SCORM 2004) objects
 * for SCORM content to communicate with the LMS
 */
export function ScormApiAdapter({
  lessonId,
  userId,
  moduleId,
  isQuiz = false,
  passingScore,
  onScormComplete,
  onProgressUpdate,
}: ScormApiAdapterProps) {
  const dataRef = useRef<Record<string, string>>({});
  const completionStatusRef = useRef<string>('incomplete');
  const successStatusRef = useRef<string>('unknown');
  const scormDataRef = useRef<ScormData>({});
  const completionCalledRef = useRef<boolean>(false); // Track if we've already called onScormComplete

  // Reset completion state when lesson changes - always start fresh
  useEffect(() => {
    dataRef.current = {};
    completionStatusRef.current = 'incomplete';
    successStatusRef.current = 'unknown';
    scormDataRef.current = {};
    completionCalledRef.current = false;
  }, [lessonId]);

  useEffect(() => {
    // SCORM 1.2 API
    const scorm12API = {
      LMSInitialize: () => {
        return 'true';
      },
      LMSFinish: () => {
        handleFinish();
        return 'true';
      },
      LMSGetValue: (element: string) => {
        return dataRef.current[element] || '';
      },
      LMSSetValue: (element: string, value: string) => {
        dataRef.current[element] = value;

        if (element === 'cmi.core.lesson_status') {
          completionStatusRef.current = value;
          scormDataRef.current.completion_status = value;

          if (value === 'completed' || value === 'passed') {
            scormDataRef.current.success_status = value === 'passed' ? 'passed' : 'completed';
            handleCompletion();
          }
        }

        if (element === 'cmi.core.score.raw') {
          const score = parseInt(value, 10);
          if (!isNaN(score)) {
            scormDataRef.current.score_raw = score;
          }
        }

        if (element === 'cmi.core.score.min') {
          const score = parseInt(value, 10);
          if (!isNaN(score)) {
            scormDataRef.current.score_min = score;
          }
        }

        if (element === 'cmi.core.score.max') {
          const score = parseInt(value, 10);
          if (!isNaN(score)) {
            scormDataRef.current.score_max = score;
          }
        }

        if (element === 'cmi.student_data.mastery_score') {
          const score = parseInt(value, 10);
          if (!isNaN(score)) {
            scormDataRef.current.passing_score = score;
          }
        }

        return 'true';
      },
      LMSCommit: () => {
        // Report score progress if available (only on commit, not on every SetValue)
        if (scormDataRef.current.score_raw !== null && scormDataRef.current.score_raw !== undefined) {
          onProgressUpdate?.(scormDataRef.current.score_raw);
        }

        // Check if completion status was set
        const isCompleted = completionStatusRef.current === 'completed' ||
                           completionStatusRef.current === 'passed';

        // Also check if score was set (for quizzes that might not set lesson_status)
        const hasScore = scormDataRef.current.score_raw !== null && scormDataRef.current.score_raw !== undefined;

        if ((isCompleted || hasScore) && !completionCalledRef.current) {
          handleCompletion();
        }

        return 'true';
      },
      LMSGetLastError: () => '0',
      LMSGetErrorString: () => '',
      LMSGetDiagnostic: () => '',
    };

    // SCORM 2004 API
    const scorm2004API = {
      Initialize: () => {
        return 'true';
      },
      Terminate: () => {
        handleFinish();
        return 'true';
      },
      GetValue: (element: string) => {
        return dataRef.current[element] || '';
      },
      SetValue: (element: string, value: string) => {
        dataRef.current[element] = value;

        if (element === 'cmi.completion_status') {
          completionStatusRef.current = value;
          scormDataRef.current.completion_status = value;

          if (value === 'completed') {
            handleCompletion();
          }
        }

        if (element === 'cmi.success_status') {
          successStatusRef.current = value;
          scormDataRef.current.success_status = value;

          if (value === 'passed') {
            handleCompletion();
          }
        }

        if (element === 'cmi.score.scaled') {
          const score = parseFloat(value);
          if (!isNaN(score)) {
            scormDataRef.current.score_raw = score * 100; // Convert scaled (0-1) to raw (0-100)
            // Don't call onProgressUpdate here - wait for commit/finish
          }
        }

        if (element === 'cmi.score.raw') {
          const score = parseFloat(value);
          if (!isNaN(score)) {
            scormDataRef.current.score_raw = score;
            // Don't call onProgressUpdate here - wait for commit/finish
          }
        }

        if (element === 'cmi.score.min') {
          const score = parseFloat(value);
          if (!isNaN(score)) {
            scormDataRef.current.score_min = score;
          }
        }

        if (element === 'cmi.score.max') {
          const score = parseFloat(value);
          if (!isNaN(score)) {
            scormDataRef.current.score_max = score;
          }
        }

        if (element === 'cmi.scaled_passing_score') {
          const score = parseFloat(value);
          if (!isNaN(score)) {
            scormDataRef.current.passing_score = score * 100; // Convert scaled to percentage
          }
        }

        return 'true';
      },
      Commit: () => {
        // Report score progress if available (only on commit, not on every SetValue)
        if (scormDataRef.current.score_raw !== null && scormDataRef.current.score_raw !== undefined) {
          onProgressUpdate?.(scormDataRef.current.score_raw);
        }

        // Check if completion status was set
        const isCompleted = completionStatusRef.current === 'completed' ||
                           successStatusRef.current === 'passed';

        // Also check if score was set (for quizzes that might not set completion_status)
        const hasScore = scormDataRef.current.score_raw !== null && scormDataRef.current.score_raw !== undefined;

        if ((isCompleted || hasScore) && !completionCalledRef.current) {
          handleCompletion();
        }

        return 'true';
      },
      GetLastError: () => '0',
      GetErrorString: () => '',
      GetDiagnostic: () => '',
    };

    const handleCompletion = async () => {
      if (completionCalledRef.current) {
        return;
      }

      // Store all CMI data for reference
      scormDataRef.current.cmi_data = { ...dataRef.current };

      // Mark that we've called completion
      completionCalledRef.current = true;

      // Call the completion callback (enables Mark Complete button or triggers auto-complete)
      onScormComplete?.(scormDataRef.current);
    };

    const handleFinish = () => {
      // Check if content was completed but handleCompletion wasn't triggered
      // This can happen if the SCORM package sets status and immediately calls Finish
      const isCompleted = completionStatusRef.current === 'completed' ||
                         completionStatusRef.current === 'passed' ||
                         successStatusRef.current === 'passed' ||
                         successStatusRef.current === 'completed';

      // Also consider it complete if a score was set (for quizzes)
      const hasScore = scormDataRef.current.score_raw !== null && scormDataRef.current.score_raw !== undefined;

      if ((isCompleted || hasScore) && !completionCalledRef.current) {
        handleCompletion();
      }
    };

    // Replace methods on existing API objects (SCORM content may have grabbed a reference already)
    // Don't replace the entire object, just update the methods
    const existingAPI = (window as any).API || {};
    Object.assign(existingAPI, scorm12API);
    (window as any).API = existingAPI;

    const existingAPI2004 = (window as any).API_1484_11 || {};
    Object.assign(existingAPI2004, scorm2004API);
    (window as any).API_1484_11 = existingAPI2004;

    // Add IsLmsPresent function that some SCORM content checks for
    (window as any).IsLmsPresent = () => true;

    // Also add a helper function for SCORM content to find the API
    // Some SCORM content looks for this function
    (window as any).API_GetAPI = () => scorm12API;
    (window as any).API_1484_11_GetAPI = () => scorm2004API;

    // SCORM content often searches for API in parent/opener windows
    // Make sure it's available at the top level
    if (window.top && window.top !== window) {
      try {
        (window.top as any).API = scorm12API;
        (window.top as any).API_1484_11 = scorm2004API;
        (window.top as any).IsLmsPresent = () => true;
        (window.top as any).API_GetAPI = () => scorm12API;
        (window.top as any).API_1484_11_GetAPI = () => scorm2004API;
      } catch {
        // Cross-origin restriction - ignore
      }
    }

    return () => {
      // Cleanup
      delete (window as any).API;
      delete (window as any).API_1484_11;
      delete (window as any).IsLmsPresent;
      delete (window as any).API_GetAPI;
      delete (window as any).API_1484_11_GetAPI;

      if (window.top && window.top !== window) {
        try {
          delete (window.top as any).API;
          delete (window.top as any).API_1484_11;
          delete (window.top as any).IsLmsPresent;
          delete (window.top as any).API_GetAPI;
          delete (window.top as any).API_1484_11_GetAPI;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [lessonId, userId, moduleId, onScormComplete, onProgressUpdate]);

  return null; // This component doesn't render anything
}

