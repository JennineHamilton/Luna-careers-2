/**
 * Edit Quiz Modal
 * Modal for editing existing quizzes with questions
 */

'use client';

import { useState, useEffect } from 'react';
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
import { LunaFileUpload } from '@/components/luna/file-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ClipboardList, Plus, Trash2, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  image_url: string | null;
  order_index: number;
  options: QuizQuestionOption[];
}

interface EditQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  onSuccess?: () => void;
}

const QUESTION_TYPES = [
  { value: 'true_false', label: 'True/False' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
];

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
          {(question.image_file || question.image_url) && (
            <p className="text-xs text-luna-gray-600 mt-1 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {question.image_file ? question.image_file.name : 'Current image'}
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

export function EditQuizModal({ open, onOpenChange, quizId, onSuccess }: EditQuizModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
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

  // Fetch quiz data when modal opens
  useEffect(() => {
    if (open && quizId) {
      fetchQuizData();
    }
  }, [open, quizId]);

  const fetchQuizData = async () => {
    setFetching(true);
    setError('');

    try {
      const response = await fetch(`/api/learning/quizzes/${quizId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }

      const { quiz } = await response.json();

      setName(quiz.name);
      setDescription(quiz.description || '');
      setDurationMinutes(quiz.duration_minutes.toString());
      setNumberOfQuestions(quiz.number_of_questions.toString());
      setIsGraded(quiz.is_graded);
      setPassingScore(quiz.passing_score?.toString() || '70');

      // Load questions
      if (quiz.quiz_questions && quiz.quiz_questions.length > 0) {
        const loadedQuestions: QuizQuestion[] = quiz.quiz_questions.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          image_file: null,
          image_url: q.image_url,
          order_index: q.order_index,
          options: q.quiz_question_options.map((opt: any) => ({
            id: opt.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            order_index: opt.order_index,
          })),
        }));
        setQuestions(loadedQuestions);
      }
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quiz');
    } finally {
      setFetching(false);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'single_choice',
      image_file: null,
      image_url: null,
      order_index: questions.length,
      options: [
        { id: crypto.randomUUID(), option_text: '', is_correct: false, order_index: 0 },
        { id: crypto.randomUUID(), option_text: '', is_correct: false, order_index: 1 },
      ],
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId).map((q, idx) => ({ ...q, order_index: idx })));
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

      // First, update quiz metadata
      const updateData = {
        name: name.trim(),
        description: description.trim() || null,
        duration_minutes: duration,
        number_of_questions: numQuestions,
        is_graded: isGraded,
        passing_score: isGraded ? parseInt(passingScore) : null,
      };

      const response = await fetch(`/api/learning/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quiz');
      }

      // Upload new images to storage
      const questionImageUrls: (string | null)[] = await Promise.all(
        questions.map(async (q) => {
          // If there's a new image file, upload it
          if (q.image_file) {
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
          }

          // If there's an existing image URL (no new file), keep it
          return q.image_url;
        })
      );

      // For now, we'll delete and recreate all questions
      // This is simpler than trying to diff and update individual questions
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

      // Delete the quiz and recreate it with new questions
      await fetch(`/api/learning/quizzes/${quizId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      // Create new quiz with same data
      const createResponse = await fetch('/api/learning/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quizData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to recreate quiz');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Error updating quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            Edit Quiz
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update quiz settings and questions
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {fetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              {/* Quiz Name */}
              <LunaInput
                label="Quiz Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter quiz name"
                disabled={loading}
              />

              {/* Description */}
              <LunaTextarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter quiz description (optional)"
                rows={3}
                disabled={loading}
              />

              {/* Quiz Settings - Inline Layout */}
              <div className="grid grid-cols-2 gap-4">
                <LunaInput
                  label="Duration (minutes)"
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
                  helperText="Questions shown to user (randomly selected)"
                  disabled={loading}
                />
              </div>

              {/* Grading Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-luna-gray-900">Graded Quiz</label>
                    <p className="text-xs text-luna-gray-500">Enable scoring and pass/fail</p>
                  </div>
                  <LunaSwitch
                    checked={isGraded}
                    onCheckedChange={setIsGraded}
                    disabled={loading}
                  />
                </div>

                {isGraded && (
                  <LunaInput
                    label="Passing Score (%)"
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

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-luna-gray-900">Questions</h3>
                    <p className="text-xs text-luna-gray-500">
                      {questions.length} question{questions.length !== 1 ? 's' : ''} created
                    </p>
                  </div>
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
                          <div className="flex items-center gap-3 text-left">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                              {qIndex + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-luna-gray-900 truncate">
                                {question.question_text || 'Untitled Question'}
                              </p>
                              <p className="text-xs text-luna-gray-500">
                                {QUESTION_TYPES.find(t => t.value === question.question_type)?.label} • {question.options.length} options
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
            </>
          )}
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading || fetching}
          >
            Cancel
          </LunaButton>
          <LunaButton
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || fetching}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {loading ? 'Updating...' : 'Update Quiz'}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

