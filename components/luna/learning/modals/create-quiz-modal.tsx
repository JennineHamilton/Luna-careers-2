/**
 * Create Quiz Modal
 * Modal for creating new quizzes with questions
 */

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
  LunaSelect,
  LunaSelectItem,
  LunaSwitch,
  LunaAccordion,
  LunaAccordionItem,
  LunaAccordionTrigger,
  LunaAccordionContent,
  LunaRadioGroup,
  LunaRadio,
  LunaCheckbox,
} from '@/components/luna';
import { createClient } from '@/lib/supabase/client';
import { LunaFileUpload } from '@/components/luna/file-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ClipboardList, Plus, Trash2, HelpCircle, Image as ImageIcon } from 'lucide-react';

interface QuizQuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'true_false' | 'single_choice' | 'multiple_choice';
  image_file: File | null;
  order_index: number;
  options: QuizQuestionOption[];
}

interface CreateQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const QUESTION_TYPES = [
  { value: 'true_false', label: 'True/False' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
] as const;

// Question Form Component (for editing questions in accordions)
interface QuestionFormProps {
  question: QuizQuestion;
  onUpdate: (question: QuizQuestion) => void;
  disabled?: boolean;
}

function QuestionForm({ question, onUpdate, disabled }: QuestionFormProps) {
  const handleQuestionTextChange = (text: string) => {
    onUpdate({ ...question, question_text: text });
  };

  const handleQuestionTypeChange = (type: 'true_false' | 'single_choice' | 'multiple_choice') => {
    let newOptions = question.options;

    // Auto-populate options for True/False
    if (type === 'true_false') {
      newOptions = [
        { id: crypto.randomUUID(), option_text: 'True', is_correct: false, order_index: 0 },
        { id: crypto.randomUUID(), option_text: 'False', is_correct: false, order_index: 1 },
      ];
    }

    onUpdate({ ...question, question_type: type, options: newOptions });
  };

  const handleImageChange = (files: File[]) => {
    onUpdate({ ...question, image_file: files[0] || null });
  };

  const handleAddOption = () => {
    const newOption: QuizQuestionOption = {
      id: crypto.randomUUID(),
      option_text: '',
      is_correct: false,
      order_index: question.options.length,
    };
    onUpdate({ ...question, options: [...question.options, newOption] });
  };

  const handleRemoveOption = (optionId: string) => {
    const newOptions = question.options
      .filter(opt => opt.id !== optionId)
      .map((opt, idx) => ({ ...opt, order_index: idx }));
    onUpdate({ ...question, options: newOptions });
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    const newOptions = question.options.map(opt =>
      opt.id === optionId ? { ...opt, option_text: text } : opt
    );
    onUpdate({ ...question, options: newOptions });
  };

  const handleOptionCorrectChange = (optionId: string, isCorrect: boolean) => {
    let newOptions;
    if (question.question_type === 'single_choice') {
      // For single choice, uncheck all others
      newOptions = question.options.map(opt => ({
        ...opt,
        is_correct: opt.id === optionId ? isCorrect : false,
      }));
    } else {
      // For multiple choice, just toggle this one
      newOptions = question.options.map(opt =>
        opt.id === optionId ? { ...opt, is_correct: isCorrect } : opt
      );
    }
    onUpdate({ ...question, options: newOptions });
  };

  return (
    <div className="space-y-4 pt-2">
      <LunaTextarea
        label="Question Text"
        required
        value={question.question_text}
        onChange={(e) => handleQuestionTextChange(e.target.value)}
        placeholder="Enter your question"
        rows={3}
        disabled={disabled}
      />

      <div className="grid grid-cols-2 gap-4">
        <LunaSelect
          label="Question Type"
          required
          value={question.question_type}
          onValueChange={(value) => handleQuestionTypeChange(value as any)}
          disabled={disabled}
        >
          {QUESTION_TYPES.map((type) => (
            <LunaSelectItem key={type.value} value={type.value}>
              {type.label}
            </LunaSelectItem>
          ))}
        </LunaSelect>

        <div>
          <label className="text-sm font-medium text-luna-gray-900 mb-2 block">
            Question Image (Optional)
          </label>
          <LunaFileUpload
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            onFilesChange={handleImageChange}
            helperText="PNG, JPG (max 5MB)"
            disabled={disabled}
          />
          {question.image_file && (
            <p className="text-xs text-luna-gray-600 mt-1 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {question.image_file.name}
            </p>
          )}
        </div>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-luna-gray-900">
            Answer Options
          </label>
          {question.question_type !== 'true_false' && (
            <LunaButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddOption}
              disabled={disabled}
              icon={<Plus className="w-3 h-3" />}
            >
              Add Option
            </LunaButton>
          )}
        </div>

        {question.question_type === 'single_choice' ? (
          <LunaRadioGroup
            value={question.options.find(o => o.is_correct)?.id || ''}
            onValueChange={(value) => handleOptionCorrectChange(value, true)}
          >
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <div key={option.id} className="flex items-start gap-2">
                  <LunaRadio value={option.id} disabled={disabled} />

                  <LunaInput
                    value={option.option_text}
                    onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                    disabled={disabled}
                  />

                  {question.options.length > 2 && (
                    <LunaButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(option.id)}
                      disabled={disabled}
                      icon={<Trash2 className="w-4 h-4" />}
                      className="text-red-600 hover:text-red-700"
                    />
                  )}
                </div>
              ))}
            </div>
          </LunaRadioGroup>
        ) : question.question_type === 'multiple_choice' ? (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <div key={option.id} className="flex items-start gap-2">
                <LunaCheckbox
                  checked={option.is_correct}
                  onCheckedChange={(checked) => handleOptionCorrectChange(option.id, checked as boolean)}
                  disabled={disabled}
                />

                <LunaInput
                  value={option.option_text}
                  onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                  disabled={disabled}
                />

                {question.options.length > 2 && (
                  <LunaButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(option.id)}
                    disabled={disabled}
                    icon={<Trash2 className="w-4 h-4" />}
                    className="text-red-600 hover:text-red-700"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <div key={option.id} className="flex items-start gap-2">
                <LunaCheckbox
                  checked={option.is_correct}
                  onCheckedChange={(checked) => handleOptionCorrectChange(option.id, checked as boolean)}
                  disabled={disabled}
                />

                <LunaInput
                  value={option.option_text}
                  onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  disabled={true}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-luna-gray-500">
          {question.question_type === 'single_choice' && 'Select the radio button for the correct answer'}
          {question.question_type === 'multiple_choice' && 'Check all correct answers'}
          {question.question_type === 'true_false' && 'Select True or False as the correct answer'}
        </p>
      </div>
    </div>
  );
}

export function CreateQuizModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateQuizModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Quiz metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [numberOfQuestions, setNumberOfQuestions] = useState('10');
  const [isGraded, setIsGraded] = useState(true);
  const [passingScore, setPassingScore] = useState('70');

  // Questions
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const handleReset = () => {
    setName('');
    setDescription('');
    setDurationMinutes('30');
    setNumberOfQuestions('10');
    setIsGraded(true);
    setPassingScore('70');
    setQuestions([]);
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'single_choice',
      image_file: null,
      order_index: questions.length,
      options: [
        { id: crypto.randomUUID(), option_text: '', is_correct: false, order_index: 0 },
        { id: crypto.randomUUID(), option_text: '', is_correct: false, order_index: 1 },
      ],
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId).map((q, idx) => ({
      ...q,
      order_index: idx,
    })));
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('Quiz name is required');
      return;
    }

    const duration = parseInt(durationMinutes);
    if (isNaN(duration) || duration <= 0) {
      setError('Duration must be a positive number');
      return;
    }

    const numQuestions = parseInt(numberOfQuestions);
    if (isNaN(numQuestions) || numQuestions <= 0) {
      setError('Number of questions must be a positive number');
      return;
    }

    if (questions.length === 0) {
      setError('At least one question is required');
      return;
    }

    if (numQuestions > questions.length) {
      setError(`Number of questions to show (${numQuestions}) cannot exceed total questions created (${questions.length})`);
      return;
    }

    if (isGraded) {
      const passing = parseInt(passingScore);
      if (isNaN(passing) || passing <= 0 || passing > 100) {
        setError('Passing score must be between 1 and 100');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      // Upload images to storage first
      const questionImageUrls: (string | null)[] = await Promise.all(
        questions.map(async (q) => {
          if (!q.image_file) return null;

          try {
            const fileExt = q.image_file.name.split('.').pop();
            const fileName = `${Date.now()}-${q.id}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('quiz-images')
              .upload(fileName, q.image_file);

            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              throw new Error(`Failed to upload image for question: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase.storage
              .from('quiz-images')
              .getPublicUrl(uploadData.path);

            return publicUrl;
          } catch (err) {
            console.error('Error processing image:', err);
            throw err;
          }
        })
      );

      const quizData = {
        name: name.trim(),
        description: description.trim() || null,
        duration_minutes: duration,
        number_of_questions: numQuestions,
        is_graded: isGraded,
        passing_score: isGraded ? parseInt(passingScore) : null,
        questions: questions.map((q, index) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          image_url: questionImageUrls[index],
          order_index: q.order_index,
          options: q.options.map(opt => ({
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            order_index: opt.order_index,
          })),
        })),
      };

      const response = await fetch('/api/learning/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quiz');
      }

      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            Create Quiz
          </LunaDialogTitle>
          <LunaDialogDescription>
            Create a new quiz with custom questions. Add questions one by one using the question builder below.
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quiz Metadata */}
          <div className="space-y-4">
            <LunaInput
              label="Quiz Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter quiz name"
              disabled={loading}
            />

            <LunaTextarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description (optional)"
              rows={3}
              disabled={loading}
            />

            {/* Compact inline fields */}
            <div className="grid grid-cols-4 gap-3">
              <LunaInput
                label="Duration (min)"
                required
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                disabled={loading}
              />

              <LunaInput
                label="# Questions"
                required
                type="number"
                min="1"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)}
                disabled={loading}
              />

              <div className="flex items-end pb-2">
                <LunaSwitch
                  label="Graded"
                  checked={isGraded}
                  onCheckedChange={setIsGraded}
                  disabled={loading}
                />
              </div>

              {isGraded && (
                <LunaInput
                  label="Passing %"
                  required
                  type="number"
                  min="1"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  disabled={loading}
                />
              )}
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4 border-t border-luna-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-luna-gray-900">
                Questions ({questions.length}/{numberOfQuestions})
              </h3>
              <LunaButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddQuestion}
                disabled={loading}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Question
              </LunaButton>
            </div>

            {/* Existing Questions - Editable Accordions */}
            {questions.length > 0 && (
              <LunaAccordion type="multiple" className="space-y-2">
                {questions.map((question, qIndex) => (
                  <LunaAccordionItem
                    key={question.id}
                    value={question.id}
                    className="border border-luna-gray-200 rounded-lg px-4 relative"
                  >
                    <div className="absolute right-4 top-4 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(question.id);
                        }}
                        disabled={loading}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        aria-label="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <LunaAccordionTrigger className="hover:no-underline pr-10">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <HelpCircle className="h-4 w-4 text-purple-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-luna-gray-900 truncate">
                            {question.question_text || `Question ${qIndex + 1}`}
                          </p>
                          <p className="text-xs text-luna-gray-500">
                            {QUESTION_TYPES.find(t => t.value === question.question_type)?.label}
                            {question.image_file && ' • Has Image'}
                            {' • '}{question.options.length} options
                          </p>
                        </div>
                      </div>
                    </LunaAccordionTrigger>
                    <LunaAccordionContent>
                      <QuestionForm
                        question={question}
                        onUpdate={(updatedQuestion) => {
                          setQuestions(prev => prev.map(q =>
                            q.id === question.id ? updatedQuestion : q
                          ));
                        }}
                        disabled={loading}
                      />
                    </LunaAccordionContent>
                  </LunaAccordionItem>
                ))}
              </LunaAccordion>
            )}
          </div>
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </LunaButton>
          <LunaButton
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || questions.length === 0}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {loading ? 'Creating...' : 'Create Quiz'}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

