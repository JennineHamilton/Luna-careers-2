/**
 * Tests for SCORM API Adapter Component
 * Tests SCORM 1.2 and SCORM 2004 API initialization and data tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ScormApiAdapter } from '@/components/luna/learning/scorm-api-adapter';

describe('ScormApiAdapter', () => {
  const mockProps = {
    lessonId: 'lesson-123',
    userId: 'user-123',
    moduleId: 'module-123',
    isQuiz: false,
    passingScore: 80,
    onScormComplete: vi.fn(),
    onProgressUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up window API objects
    delete (window as any).API;
    delete (window as any).API_1484_11;
  });

  afterEach(() => {
    // Clean up window API objects
    delete (window as any).API;
    delete (window as any).API_1484_11;
  });

  describe('SCORM 1.2 API', () => {
    it('should initialize SCORM 1.2 API on window', () => {
      render(<ScormApiAdapter {...mockProps} />);

      expect((window as any).API).toBeDefined();
      expect((window as any).API.LMSInitialize).toBeDefined();
      expect((window as any).API.LMSFinish).toBeDefined();
      expect((window as any).API.LMSGetValue).toBeDefined();
      expect((window as any).API.LMSSetValue).toBeDefined();
    });

    it('should handle LMSInitialize', () => {
      render(<ScormApiAdapter {...mockProps} />);

      const result = (window as any).API.LMSInitialize();
      expect(result).toBe('true');
    });

    it('should handle LMSSetValue and LMSGetValue', () => {
      render(<ScormApiAdapter {...mockProps} />);

      (window as any).API.LMSSetValue('cmi.core.student_name', 'Test User');
      const value = (window as any).API.LMSGetValue('cmi.core.student_name');

      expect(value).toBe('Test User');
    });

    it('should track completion status', () => {
      render(<ScormApiAdapter {...mockProps} />);

      (window as any).API.LMSSetValue('cmi.core.lesson_status', 'completed');
      (window as any).API.LMSCommit();

      expect(mockProps.onScormComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          completion_status: 'completed',
          success_status: 'completed',
        })
      );
    });

    it('should track score', () => {
      render(<ScormApiAdapter {...mockProps} />);

      (window as any).API.LMSSetValue('cmi.core.score.raw', '85');
      (window as any).API.LMSSetValue('cmi.core.score.min', '0');
      (window as any).API.LMSSetValue('cmi.core.score.max', '100');
      (window as any).API.LMSCommit();

      expect(mockProps.onProgressUpdate).toHaveBeenCalledWith(85);
    });

    it('should handle LMSFinish', () => {
      render(<ScormApiAdapter {...mockProps} />);

      (window as any).API.LMSSetValue('cmi.core.lesson_status', 'completed');
      const result = (window as any).API.LMSFinish();

      expect(result).toBe('true');
      expect(mockProps.onScormComplete).toHaveBeenCalled();
    });
  });

  describe('SCORM 2004 API', () => {
    it('should initialize SCORM 2004 API on window', () => {
      render(<ScormApiAdapter {...mockProps} />);

      expect((window as any).API_1484_11).toBeDefined();
      expect((window as any).API_1484_11.Initialize).toBeDefined();
      expect((window as any).API_1484_11.Terminate).toBeDefined();
      expect((window as any).API_1484_11.GetValue).toBeDefined();
      expect((window as any).API_1484_11.SetValue).toBeDefined();
    });

    it('should handle Initialize', () => {
      render(<ScormApiAdapter {...mockProps} />);

      const result = (window as any).API_1484_11.Initialize('');
      expect(result).toBe('true');
    });

    it('should handle SetValue and GetValue', () => {
      render(<ScormApiAdapter {...mockProps} />);

      (window as any).API_1484_11.SetValue('cmi.learner_name', 'Test User');
      const value = (window as any).API_1484_11.GetValue('cmi.learner_name');

      expect(value).toBe('Test User');
    });

    it('should track completion status', () => {
      render(<ScormApiAdapter {...mockProps} />);

      (window as any).API_1484_11.SetValue('cmi.completion_status', 'completed');
      (window as any).API_1484_11.Commit('');

      expect(mockProps.onScormComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          completion_status: 'completed',
        })
      );
    });

    it('should track score', () => {
      render(<ScormApiAdapter {...mockProps} />);

      (window as any).API_1484_11.SetValue('cmi.score.raw', '90');
      (window as any).API_1484_11.SetValue('cmi.score.min', '0');
      (window as any).API_1484_11.SetValue('cmi.score.max', '100');
      (window as any).API_1484_11.Commit('');

      expect(mockProps.onProgressUpdate).toHaveBeenCalledWith(90);
    });

    it('should handle Terminate', () => {
      render(<ScormApiAdapter {...mockProps} />);

      (window as any).API_1484_11.SetValue('cmi.completion_status', 'completed');
      const result = (window as any).API_1484_11.Terminate('');

      expect(result).toBe('true');
      expect(mockProps.onScormComplete).toHaveBeenCalled();
    });
  });

  describe('Quiz Mode', () => {
    it('should track quiz attempts', () => {
      const quizProps = { ...mockProps, isQuiz: true };
      render(<ScormApiAdapter {...quizProps} />);

      (window as any).API.LMSSetValue('cmi.core.lesson_status', 'completed');
      (window as any).API.LMSSetValue('cmi.core.score.raw', '75');
      (window as any).API.LMSCommit();

      expect(mockProps.onScormComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          score_raw: 75,
          completion_status: 'completed',
        })
      );
    });

    it('should determine pass/fail based on passing score', () => {
      const quizProps = { ...mockProps, isQuiz: true, passingScore: 80 };
      render(<ScormApiAdapter {...quizProps} />);

      (window as any).API.LMSSetValue('cmi.core.score.raw', '85');
      (window as any).API.LMSSetValue('cmi.core.lesson_status', 'passed');
      (window as any).API.LMSCommit();

      expect(mockProps.onScormComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          score_raw: 85,
          passing_score: 80,
          success_status: 'passed',
        })
      );
    });
  });

  describe('State Reset', () => {
    it('should reset state when lessonId changes', () => {
      const { rerender } = render(<ScormApiAdapter {...mockProps} />);

      // Set some data
      (window as any).API.LMSSetValue('cmi.core.student_name', 'Test User');
      (window as any).API.LMSSetValue('cmi.core.lesson_status', 'completed');

      // Change lesson
      rerender(<ScormApiAdapter {...mockProps} lessonId="lesson-456" />);

      // Data should be reset
      const value = (window as any).API.LMSGetValue('cmi.core.student_name');
      expect(value).toBe('');
    });
  });
});

