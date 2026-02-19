'use client';

/**
 * Knowledge Assessment Form
 * Form for creating knowledge/skill test assessments
 */

import { useState, useEffect } from 'react';
import {
  LunaInput,
  LunaTextarea,
  LunaSelect,
  LunaSelectItem,
} from '@/components/luna';

export interface KnowledgeFormData {
  title: string;
  description: string;
  category: string;
  questions_per_attempt: string;
  passing_threshold: string;
  time_limit_minutes: string;
  allow_review: boolean;
  is_published: boolean;
}

export interface KnowledgeAssessmentFormProps {
  onValidationChange: (isValid: boolean) => void;
  onFormDataChange: (data: KnowledgeFormData) => void;
  initialData?: KnowledgeFormData;
}

const CATEGORIES = [
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'excel', label: 'Microsoft Excel' },
  { value: 'internet_basics', label: 'Internet Basics' },
  { value: 'microsoft_office', label: 'Microsoft Office' },
  { value: 'data_entry', label: 'Data Entry' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'general_knowledge', label: 'General Knowledge' },
  { value: 'other', label: 'Other' },
];

export function KnowledgeAssessmentForm({ 
  onValidationChange, 
  onFormDataChange, 
  initialData 
}: KnowledgeAssessmentFormProps) {
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'general_knowledge');
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(initialData?.questions_per_attempt || '10');
  const [passingThreshold, setPassingThreshold] = useState(initialData?.passing_threshold || '70');
  const [timeLimit, setTimeLimit] = useState(initialData?.time_limit_minutes || '30');
  const [allowReview, setAllowReview] = useState(initialData?.allow_review !== false);
  const [isPublished, setIsPublished] = useState(initialData?.is_published !== false);

  // Validation effect
  useEffect(() => {
    const isValid = 
      title.trim() !== '' && 
      category !== '' &&
      parseInt(questionsPerAttempt) > 0 &&
      parseInt(passingThreshold) >= 0 && parseInt(passingThreshold) <= 100 &&
      parseInt(timeLimit) > 0;
    onValidationChange(isValid);
  }, [title, category, questionsPerAttempt, passingThreshold, timeLimit, onValidationChange]);

  // Form data change effect
  useEffect(() => {
    onFormDataChange({
      title,
      description,
      category,
      questions_per_attempt: questionsPerAttempt,
      passing_threshold: passingThreshold,
      time_limit_minutes: timeLimit,
      allow_review: allowReview,
      is_published: isPublished,
    });
  }, [title, description, category, questionsPerAttempt, passingThreshold, timeLimit, allowReview, isPublished, onFormDataChange]);

  return (
    <div className="space-y-4">
      <LunaInput
        label="Assessment Title"
        placeholder="e.g., Cybersecurity Fundamentals"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <LunaTextarea
        label="Description"
        placeholder="Brief description of what this assessment covers..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <LunaSelect
        label="Category"
        required
        value={category}
        onValueChange={setCategory}
        placeholder="Select a category"
      >
        {CATEGORIES.map((cat) => (
          <LunaSelectItem key={cat.value} value={cat.value}>
            {cat.label}
          </LunaSelectItem>
        ))}
      </LunaSelect>

      <div className="grid grid-cols-2 gap-4">
        <LunaInput
          label="Questions Per Attempt"
          type="number"
          min="1"
          value={questionsPerAttempt}
          onChange={(e) => setQuestionsPerAttempt(e.target.value)}
          required
          helperText="How many questions to randomly serve per attempt"
        />

        <LunaInput
          label="Passing Threshold (%)"
          type="number"
          min="0"
          max="100"
          value={passingThreshold}
          onChange={(e) => setPassingThreshold(e.target.value)}
          required
          helperText="Percentage required to pass (0-100)"
        />
      </div>

      <LunaInput
        label="Time Limit (minutes)"
        type="number"
        min="1"
        value={timeLimit}
        onChange={(e) => setTimeLimit(e.target.value)}
        required
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allow_review"
            checked={allowReview}
            onChange={(e) => setAllowReview(e.target.checked)}
            className="rounded border-luna-gray-300"
          />
          <label htmlFor="allow_review" className="text-sm text-luna-gray-700 cursor-pointer">
            Allow users to review and change answers before submitting
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-luna-gray-300"
          />
          <label htmlFor="is_published" className="text-sm text-luna-gray-700 cursor-pointer">
            Published (visible to users on screening page)
          </label>
        </div>
      </div>
    </div>
  );
}

