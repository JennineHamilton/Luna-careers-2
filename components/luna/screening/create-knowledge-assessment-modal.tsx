'use client';

import { useState } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDialogFooter,
  LunaButton,
  LunaInput,
  LunaTextarea,
  LunaInputLabel,
  LunaSelect,
  LunaSelectItem,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CreateKnowledgeAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  questions_per_attempt: string;
  passing_threshold: string;
  time_limit_minutes: string;
  allow_review: boolean;
  is_published: boolean;
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

export function CreateKnowledgeAssessmentModal({
  open,
  onClose,
  onSuccess,
}: CreateKnowledgeAssessmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'general_knowledge',
    questions_per_attempt: '10',
    passing_threshold: '70',
    time_limit_minutes: '30',
    allow_review: true,
    is_published: false,
  });

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        category: 'general_knowledge',
        questions_per_attempt: '10',
        passing_threshold: '70',
        time_limit_minutes: '30',
        allow_review: true,
        is_published: false,
      });
      setError('');
      onClose();
    }
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    const questionsPerAttempt = parseInt(formData.questions_per_attempt);
    const passingThreshold = parseInt(formData.passing_threshold);
    const timeLimit = parseInt(formData.time_limit_minutes);

    if (questionsPerAttempt < 1) {
      setError('Questions per attempt must be at least 1');
      return;
    }

    if (passingThreshold < 0 || passingThreshold > 100) {
      setError('Passing threshold must be between 0 and 100');
      return;
    }

    if (timeLimit < 1) {
      setError('Time limit must be at least 1 minute');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/screening/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          questions_per_attempt: questionsPerAttempt,
          passing_threshold: passingThreshold,
          time_limit_minutes: timeLimit,
          allow_review: formData.allow_review,
          is_published: formData.is_published,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assessment');
      }

      setLoading(false);
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating assessment:', err);
      setError(err.message || 'Failed to create assessment');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={handleClose}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Create Knowledge Assessment
          </LunaDialogTitle>
          <LunaDialogDescription>
            Create a new knowledge or skill test. You'll add questions after creating the assessment.
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <LunaInputLabel htmlFor="title">Title *</LunaInputLabel>
            <LunaInput
              id="title"
              placeholder="e.g., Cybersecurity Fundamentals"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <LunaInputLabel htmlFor="description">Description</LunaInputLabel>
            <LunaTextarea
              id="description"
              placeholder="Brief description of what this assessment covers..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <LunaInputLabel htmlFor="category">Category *</LunaInputLabel>
            <LunaSelect
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={loading}
              placeholder="Select a category"
            >
              {CATEGORIES.map((cat) => (
                <LunaSelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </LunaSelectItem>
              ))}
            </LunaSelect>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <LunaInputLabel htmlFor="questions_per_attempt">Questions Per Attempt *</LunaInputLabel>
              <LunaInput
                id="questions_per_attempt"
                type="number"
                min="1"
                value={formData.questions_per_attempt}
                onChange={(e) => setFormData({ ...formData, questions_per_attempt: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-luna-gray-500">
                How many questions to randomly serve per attempt
              </p>
            </div>

            <div className="space-y-2">
              <LunaInputLabel htmlFor="passing_threshold">Passing Threshold (%) *</LunaInputLabel>
              <LunaInput
                id="passing_threshold"
                type="number"
                min="0"
                max="100"
                value={formData.passing_threshold}
                onChange={(e) => setFormData({ ...formData, passing_threshold: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-luna-gray-500">
                Percentage required to pass (0-100)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <LunaInputLabel htmlFor="time_limit">Time Limit (minutes) *</LunaInputLabel>
            <LunaInput
              id="time_limit"
              type="number"
              min="1"
              value={formData.time_limit_minutes}
              onChange={(e) => setFormData({ ...formData, time_limit_minutes: e.target.value })}
              disabled={loading}
            />
          </div>
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </LunaButton>
          <LunaButton onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Assessment
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

