'use client';

/**
 * Knowledge Question Builder
 * Component for adding and managing questions in knowledge assessments
 * Refactored to match quiz builder pattern
 */

import {
  LunaButton,
  LunaInput,
  LunaTextarea,
  LunaSelect,
  LunaSelectItem,
  LunaAccordion,
  LunaAccordionItem,
  LunaAccordionTrigger,
  LunaAccordionContent,
  LunaCheckbox,
  LunaRadioGroup,
  LunaRadio,
} from '@/components/luna';
import { LunaFileUpload } from '@/components/luna/file-upload';
import { Plus, Trash2, Image as ImageIcon, HelpCircle } from 'lucide-react';

export interface KnowledgeQuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface KnowledgeQuestion {
  id: string;
  question_text: string;
  question_type: 'true_false' | 'single_select' | 'multiple_select';
  image_url?: string;
  image_file?: File;
  options: KnowledgeQuestionOption[];
}

interface KnowledgeQuestionBuilderProps {
  questions: KnowledgeQuestion[];
  onQuestionsChange: (questions: KnowledgeQuestion[]) => void;
}

const QUESTION_TYPES = [
  { value: 'true_false', label: 'True/False' },
  { value: 'single_select', label: 'Single Select (One Correct Answer)' },
  { value: 'multiple_select', label: 'Multiple Select (Multiple Correct Answers)' },
];

// Question Form Component (for editing questions in accordions)
interface QuestionFormProps {
  question: KnowledgeQuestion;
  onUpdate: (question: KnowledgeQuestion) => void;
  disabled?: boolean;
}

function QuestionForm({ question, onUpdate, disabled }: QuestionFormProps) {
  const handleQuestionTextChange = (text: string) => {
    onUpdate({ ...question, question_text: text });
  };

  const handleQuestionTypeChange = (type: 'true_false' | 'single_select' | 'multiple_select') => {
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
    onUpdate({ ...question, image_file: files[0] || undefined });
  };

  const handleAddOption = () => {
    const newOption: KnowledgeQuestionOption = {
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
    if (question.question_type === 'single_select' || question.question_type === 'true_false') {
      // For single select and true/false, uncheck all others
      newOptions = question.options.map(opt => ({
        ...opt,
        is_correct: opt.id === optionId ? isCorrect : false,
      }));
    } else {
      // For multiple select, just toggle this one
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

        {question.question_type === 'single_select' ? (
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
        ) : question.question_type === 'multiple_select' ? (
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
          {question.question_type === 'single_select' && 'Select the radio button for the correct answer'}
          {question.question_type === 'multiple_select' && 'Check all correct answers'}
          {question.question_type === 'true_false' && 'Select True or False as the correct answer'}
        </p>
      </div>
    </div>
  );
}

export function KnowledgeQuestionBuilder({ questions, onQuestionsChange }: KnowledgeQuestionBuilderProps) {
  const handleAddQuestion = () => {
    const newQuestion: KnowledgeQuestion = {
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'single_select',
      image_file: undefined,
      options: [
        { id: crypto.randomUUID(), option_text: '', is_correct: false, order_index: 0 },
        { id: crypto.randomUUID(), option_text: '', is_correct: false, order_index: 1 },
      ],
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const handleDeleteQuestion = (questionId: string) => {
    onQuestionsChange(questions.filter(q => q.id !== questionId));
  };

  return (
    <div className="space-y-4">
      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-luna-gray-900">
            Questions ({questions.length})
          </h3>
          <LunaButton
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddQuestion}
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
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
                      onQuestionsChange(questions.map(q =>
                        q.id === question.id ? updatedQuestion : q
                      ));
                    }}
                  />
                </LunaAccordionContent>
              </LunaAccordionItem>
            ))}
          </LunaAccordion>
        )}
      </div>
    </div>
  );
}

