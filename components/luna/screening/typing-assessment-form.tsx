'use client';

/**
 * Typing Assessment Form
 * Form for creating typing assessments (Basic or Transcription)
 */

import { useState, useEffect } from 'react';
import {
  LunaInput,
  LunaTextarea,
  LunaSelect,
  LunaSelectItem,
} from '@/components/luna';
import { LunaSearchableSelect } from '@/components/luna/searchable-select';

export interface FormData {
  title: string;
  description: string;
  duration: string;
  language: string;
  typingType: 'basic' | 'transcription';
}

export interface TypingAssessmentFormProps {
  onValidationChange: (isValid: boolean) => void;
  onTranscriptionChange: (isTranscription: boolean) => void;
  onFormDataChange: (data: FormData) => void;
  initialData?: FormData;
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
];

export function TypingAssessmentForm({ onValidationChange, onTranscriptionChange, onFormDataChange, initialData }: TypingAssessmentFormProps) {
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [duration, setDuration] = useState(initialData?.duration || '60');
  const [language, setLanguage] = useState(initialData?.language || 'en');
  const [typingType, setTypingType] = useState<'basic' | 'transcription'>(initialData?.typingType || 'basic');

  // Validation effect
  useEffect(() => {
    const isValid = title.trim() !== '' && duration !== '' && language !== '';
    onValidationChange(isValid);
  }, [title, duration, language, onValidationChange]);

  // Transcription type change effect
  useEffect(() => {
    onTranscriptionChange(typingType === 'transcription');
  }, [typingType, onTranscriptionChange]);

  // Form data change effect
  useEffect(() => {
    onFormDataChange({
      title,
      description,
      duration,
      language,
      typingType,
    });
  }, [title, description, duration, language, typingType, onFormDataChange]);

  const handleTypingTypeChange = (value: string) => {
    setTypingType(value as 'basic' | 'transcription');
  };

  return (
    <div className="space-y-4">
      <LunaInput
        label="Title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., English Typing Speed Test"
      />

      <LunaTextarea
        label="Short Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what this assessment measures..."
        rows={3}
      />

      {/* Duration, Language, and Typing Type in one row */}
      <div className="grid grid-cols-3 gap-4">
        <LunaInput
          label="Duration (seconds)"
          type="number"
          required
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min={30}
          max={600}
        />

        <LunaSearchableSelect
          label="Language"
          required
          options={LANGUAGE_OPTIONS}
          value={language}
          onValueChange={setLanguage}
          placeholder="Select language"
        />

        <LunaSelect
          label="Typing Assessment Type"
          required
          value={typingType}
          onValueChange={handleTypingTypeChange}
          placeholder="Select type"
        >
          <LunaSelectItem value="basic">Basic</LunaSelectItem>
          <LunaSelectItem value="transcription">Transcription</LunaSelectItem>
        </LunaSelect>
      </div>
    </div>
  );
}

