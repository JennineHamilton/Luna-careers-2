'use client';

/**
 * Create Assessment Modal - Multi-step modal for creating assessments
 * Step 1: Select assessment type (Typing, Cognitive, Coding, Soft Skills)
 * Step 2: Configure assessment based on selected type
 */

import { useState, useCallback } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDialogFooter,
  LunaButton,
  LunaStepper,
  LunaTextarea,
  LunaAccordion,
  LunaAccordionItem,
  LunaAccordionTrigger,
  LunaAccordionContent,
} from '@/components/luna';
import { LunaFileUpload } from '@/components/luna/file-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Keyboard, Brain, Code, MessageCircle, ChevronLeft, Loader2, Plus, FileAudio, Trash2, Edit2, Check, X, BookOpen, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { TypingAssessmentForm } from './typing-assessment-form';
import { KnowledgeAssessmentForm, type KnowledgeFormData } from './knowledge-assessment-form';
import { KnowledgeQuestionBuilder, type KnowledgeQuestion, type KnowledgeQuestionOption } from './knowledge-question-builder';

export interface CreateAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AssessmentType = 'typing' | 'knowledge' | 'cognitive' | 'coding' | 'soft_skills' | null;

const ASSESSMENT_TYPES = [
  {
    type: 'typing' as const,
    icon: Keyboard,
    title: 'Typing Assessment',
    description: 'Measure typing speed and accuracy',
    available: true,
  },
  {
    type: 'knowledge' as const,
    icon: BookOpen,
    title: 'Knowledge Test',
    description: 'Test knowledge on specific topics',
    available: true,
  },
  {
    type: 'cognitive' as const,
    icon: Brain,
    title: 'Cognitive Assessment',
    description: 'Coming Soon',
    available: false,
  },
  {
    type: 'coding' as const,
    icon: Code,
    title: 'Coding Assessment',
    description: 'Coming Soon',
    available: false,
  },
  {
    type: 'soft_skills' as const,
    icon: MessageCircle,
    title: 'Soft Skills Assessment',
    description: 'Coming Soon',
    available: false,
  },
];

const BASE_STEPS = [
  { label: 'Select Type', description: 'Choose assessment type' },
  { label: 'Configure', description: 'Set up assessment' },
];

const TRANSCRIPTION_STEPS = [
  { label: 'Select Type', description: 'Choose assessment type' },
  { label: 'Configure', description: 'Set up assessment' },
  { label: 'Audio Files', description: 'Manage audio files' },
];

const KNOWLEDGE_STEPS = [
  { label: 'Select Type', description: 'Choose assessment type' },
  { label: 'Configure', description: 'Set up assessment' },
  { label: 'Add Questions', description: 'Build question bank' },
];

export interface FormData {
  title: string;
  description: string;
  duration: string;
  language: string;
  typingType: 'basic' | 'transcription';
  // Knowledge test fields
  category?: string;
  questions_per_attempt?: string;
  passing_threshold?: string;
  time_limit_minutes?: string;
  allow_review?: boolean;
}

interface AudioFileWithTranscript {
  id: string;
  file: File;
  transcript: string;
  isEditing?: boolean;
}

// Audio File Accordion Item Component
function AudioFileAccordionItem({
  item,
  onDelete,
  onEdit,
  onSave,
  onCancel,
}: {
  item: AudioFileWithTranscript;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onSave: (id: string, transcript: string) => void;
  onCancel: (id: string) => void;
}) {
  const [editedTranscript, setEditedTranscript] = useState(item.transcript);

  return (
    <LunaAccordionItem value={item.id} className="border border-luna-gray-200 rounded-lg px-4">
      <LunaAccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 flex-1 text-left">
          <FileAudio className="h-4 w-4 text-luna-blue shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-luna-gray-900 truncate">
              {item.file.name}
            </p>
            <p className="text-xs text-luna-gray-500">
              {(item.file.size / 1024 / 1024).toFixed(2)} MB • Transcript: {item.transcript.length} characters
            </p>
          </div>
        </div>
      </LunaAccordionTrigger>
      <LunaAccordionContent>
        <div className="space-y-4 pt-2">
          {item.isEditing ? (
            <>
              <LunaTextarea
                label="Transcript"
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                rows={6}
                placeholder="Enter the exact text spoken in this audio file..."
              />
              <div className="flex gap-2">
                <LunaButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onSave(item.id, editedTranscript)}
                  disabled={!editedTranscript.trim()}
                  icon={<Check className="h-4 w-4" />}
                >
                  Save Changes
                </LunaButton>
                <LunaButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditedTranscript(item.transcript);
                    onCancel(item.id);
                  }}
                  icon={<X className="h-4 w-4" />}
                >
                  Cancel
                </LunaButton>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-luna-gray-700 block mb-2">
                  Transcript
                </label>
                <div className="p-3 bg-luna-gray-50 border border-luna-gray-200 rounded-lg">
                  <p className="text-sm text-luna-gray-900 whitespace-pre-wrap">
                    {item.transcript}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <LunaButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item.id)}
                  icon={<Edit2 className="h-4 w-4" />}
                >
                  Edit Transcript
                </LunaButton>
                <LunaButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  icon={<Trash2 className="h-4 w-4" />}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </LunaButton>
              </div>
            </>
          )}
        </div>
      </LunaAccordionContent>
    </LunaAccordionItem>
  );
}

export function CreateAssessmentModal({ open, onClose, onSuccess }: CreateAssessmentModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState<AssessmentType>(null);
  const [isTranscription, setIsTranscription] = useState(false);
  const [isKnowledgeTest, setIsKnowledgeTest] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [audioFilesWithTranscripts, setAudioFilesWithTranscripts] = useState<AudioFileWithTranscript[]>([]);
  const [knowledgeQuestions, setKnowledgeQuestions] = useState<KnowledgeQuestion[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [newTranscript, setNewTranscript] = useState('');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = isKnowledgeTest ? KNOWLEDGE_STEPS : (isTranscription ? TRANSCRIPTION_STEPS : BASE_STEPS);
  const totalSteps = steps.length;

  const handleTypeSelect = (type: AssessmentType) => {
    setSelectedType(type);
    setIsKnowledgeTest(type === 'knowledge');
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setSelectedType(null);
    setIsTranscription(false);
    setIsKnowledgeTest(false);
    setCanProceed(false);
    setAudioFilesWithTranscripts([]);
    setKnowledgeQuestions([]);
    setIsAddingNew(false);
    setNewAudioFile(null);
    setNewTranscript('');
    setFormData(null);
    setError('');
    setLoading(false);
    onClose();
  };

  const handleValidationChange = useCallback((isValid: boolean) => {
    setCanProceed(isValid);
  }, []);

  const handleTranscriptionChange = useCallback((isTranscription: boolean) => {
    setIsTranscription(isTranscription);
  }, []);

  const handleFormDataChange = useCallback((data: FormData) => {
    setFormData(data);
  }, []);

  const handleKnowledgeFormDataChange = useCallback((data: KnowledgeFormData) => {
    setFormData(data as any);
  }, []);

  const handleKnowledgeQuestionsChange = (questions: KnowledgeQuestion[]) => {
    setKnowledgeQuestions(questions);
  };

  const handleAddAudioFile = () => {
    if (!newAudioFile || !newTranscript.trim()) {
      setError('Please select an audio file and enter a transcript');
      return;
    }

    const newItem: AudioFileWithTranscript = {
      id: `${Date.now()}-${newAudioFile.name}`,
      file: newAudioFile,
      transcript: newTranscript,
      isEditing: false,
    };

    setAudioFilesWithTranscripts([...audioFilesWithTranscripts, newItem]);
    setNewAudioFile(null);
    setNewTranscript('');
    setIsAddingNew(false);
    setError('');
  };

  const handleCancelAdd = () => {
    setNewAudioFile(null);
    setNewTranscript('');
    setIsAddingNew(false);
    setError('');
  };

  const handleDeleteAudioFile = (id: string) => {
    setAudioFilesWithTranscripts(audioFilesWithTranscripts.filter(item => item.id !== id));
  };

  const handleEditAudioFile = (id: string) => {
    setAudioFilesWithTranscripts(audioFilesWithTranscripts.map(item =>
      item.id === id ? { ...item, isEditing: true } : item
    ));
  };

  const handleSaveEdit = (id: string, newTranscript: string) => {
    setAudioFilesWithTranscripts(audioFilesWithTranscripts.map(item =>
      item.id === id ? { ...item, transcript: newTranscript, isEditing: false } : item
    ));
  };

  const handleCancelEdit = (id: string) => {
    setAudioFilesWithTranscripts(audioFilesWithTranscripts.map(item =>
      item.id === id ? { ...item, isEditing: false } : item
    ));
  };

  const handleSubmit = async () => {
    if (!formData) return;

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Handle knowledge test creation
      if (isKnowledgeTest) {
        await createKnowledgeAssessment(formData as any, knowledgeQuestions, session.access_token);
        setLoading(false);
        handleClose();
        onSuccess();
        return;
      }

      // Create typing assessment template
      const assessmentData = {
        title: formData.title,
        description: formData.description,
        assessment_type: 'typing',
        language: formData.language,
        duration_seconds: parseInt(formData.duration),
        has_audio: formData.typingType === 'transcription',
        is_active: true,
      };

      const response = await fetch('/api/screening/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(assessmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assessment');
      }

      const { assessment } = await response.json();

      // If transcription, upload audio files
      if (formData.typingType === 'transcription' && audioFilesWithTranscripts.length > 0) {
        await uploadAudioFiles(assessment.id, audioFilesWithTranscripts, session.access_token);
      }

      // Success!
      setLoading(false);
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating assessment:', err);
      setError(err.message || 'Failed to create assessment');
      setLoading(false);
    }
  };

  const uploadAudioFiles = async (assessmentId: string, items: AudioFileWithTranscript[], token: string) => {
    const supabase = createClient();

    for (const item of items) {
      // Upload to storage
      const fileName = `${assessmentId}/${Date.now()}-${item.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assessment-audio')
        .upload(fileName, item.file);

      if (uploadError) {
        console.error('Error uploading audio file:', uploadError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assessment-audio')
        .getPublicUrl(fileName);

      // Create audio file record with transcript
      await fetch(`/api/screening/assessments/${assessmentId}/audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_name: item.file.name,
          file_url: publicUrl,
          file_size: item.file.size,
          mime_type: item.file.type,
          transcript: item.transcript,
        }),
      });
    }
  };

  const createKnowledgeAssessment = async (data: KnowledgeFormData, questions: KnowledgeQuestion[], token: string) => {
    const supabase = createClient();

    // Prepare questions with uploaded images
    const questionsWithImages = await Promise.all(
      questions.map(async (q) => {
        let imageUrl = q.image_url;

        // Upload image if present
        if (q.image_file) {
          const fileName = `knowledge/${Date.now()}-${q.image_file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('assessment-images')
            .upload(fileName, q.image_file);

          if (uploadError) {
            console.error('Error uploading question image:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('assessment-images')
              .getPublicUrl(fileName);
            imageUrl = publicUrl;
          }
        }

        return {
          question_text: q.question_text,
          question_type: q.question_type,
          image_url: imageUrl,
          options: q.options,
        };
      })
    );

    // Create knowledge assessment via API
    const response = await fetch('/api/screening/knowledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        category: data.category,
        questions_per_attempt: parseInt(data.questions_per_attempt),
        passing_threshold: parseInt(data.passing_threshold),
        time_limit_minutes: parseInt(data.time_limit_minutes),
        allow_review: data.allow_review,
        questions: questionsWithImages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create knowledge assessment');
    }

    return await response.json();
  };

  return (
    <LunaDialog open={open} onOpenChange={handleClose}>
      <LunaDialogContent className="max-w-2xl">
        {/* Sticky Header */}
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-luna-blue" />
            {currentStep === 0 ? 'Create Assessment' : `Create ${selectedType === 'typing' ? 'Typing' : ''} Assessment`}
          </LunaDialogTitle>
          <LunaDialogDescription>
            {currentStep === 0
              ? 'Choose the type of assessment you want to create'
              : 'Configure your typing assessment settings'}
          </LunaDialogDescription>
        </LunaDialogHeader>

        {/* Scrollable Body */}
        <LunaDialogBody className="text-sm max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stepper */}
          <div className="mb-6">
            <LunaStepper steps={steps} currentStep={currentStep} />
          </div>

          {/* Step 1: Type Selection */}
          {currentStep === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-luna-gray-600 mb-4">
                Choose the type of assessment you want to create:
              </p>
              {ASSESSMENT_TYPES.map((assessmentType) => {
                const Icon = assessmentType.icon;
                return (
                  <button
                    key={assessmentType.type}
                    type="button"
                    disabled={!assessmentType.available}
                    onClick={() => handleTypeSelect(assessmentType.type)}
                    className={cn(
                      'w-full p-4 rounded-lg border-2 text-left transition-all',
                      'hover:border-luna-blue hover:bg-luna-blue/5',
                      'focus:outline-none focus:ring-2 focus:ring-luna-blue focus:ring-offset-2',
                      !assessmentType.available && 'opacity-50 cursor-not-allowed hover:border-luna-border-default hover:bg-transparent'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        assessmentType.available ? 'bg-luna-blue/10 text-luna-blue' : 'bg-luna-gray-100 text-luna-gray-400'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-luna-gray-900">
                          {assessmentType.title}
                        </h3>
                        <p className="text-sm text-luna-gray-600 mt-1">
                          {assessmentType.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Type-Specific Form */}
          {currentStep === 1 && selectedType === 'typing' && (
            <TypingAssessmentForm
              onValidationChange={handleValidationChange}
              onTranscriptionChange={handleTranscriptionChange}
              onFormDataChange={handleFormDataChange}
            />
          )}

          {currentStep === 1 && selectedType === 'knowledge' && (
            <KnowledgeAssessmentForm
              onValidationChange={handleValidationChange}
              onFormDataChange={handleKnowledgeFormDataChange}
            />
          )}

          {/* Step 3: Question Builder (only for knowledge tests) */}
          {currentStep === 2 && isKnowledgeTest && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-luna-gray-600 mb-2">
                  Add questions to your knowledge assessment. The system will randomly select {formData?.questions_per_attempt || 'the specified number of'} questions from your question bank for each attempt.
                </p>
                <p className="text-xs text-luna-gray-500">
                  Make sure to add more questions than the number per attempt to ensure variety.
                </p>
              </div>

              <KnowledgeQuestionBuilder
                questions={knowledgeQuestions}
                onQuestionsChange={handleKnowledgeQuestionsChange}
              />

              {knowledgeQuestions.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-luna-gray-200 rounded-lg">
                  <HelpCircle className="h-12 w-12 text-luna-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-luna-gray-600 mb-1">No questions added yet</p>
                  <p className="text-xs text-luna-gray-500">Click "Add Question" to get started</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Audio File Management (only for transcription) */}
          {currentStep === 2 && isTranscription && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-luna-gray-600 mb-2">
                  Add audio files for transcription. Users will receive a random file each time they take the assessment.
                </p>
                <p className="text-xs text-luna-gray-500">
                  Each audio file must have a transcript for accuracy calculation.
                </p>
              </div>

              {/* Saved Audio Files List */}
              {audioFilesWithTranscripts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-luna-gray-900">
                    Audio Files ({audioFilesWithTranscripts.length})
                  </h3>
                  <LunaAccordion type="single" collapsible className="space-y-2">
                    {audioFilesWithTranscripts.map((item) => (
                      <AudioFileAccordionItem
                        key={item.id}
                        item={item}
                        onDelete={handleDeleteAudioFile}
                        onEdit={handleEditAudioFile}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                      />
                    ))}
                  </LunaAccordion>
                </div>
              )}

              {/* Add New Audio File Section */}
              {!isAddingNew ? (
                <LunaButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingNew(true)}
                  icon={<Plus className="h-4 w-4" />}
                  className="w-full"
                >
                  Add Audio File
                </LunaButton>
              ) : (
                <div className="border-2 border-luna-blue/30 rounded-lg p-6 bg-luna-blue/5 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-luna-gray-900 flex items-center gap-2">
                      <FileAudio className="h-4 w-4 text-luna-blue" />
                      New Audio File
                    </h3>
                  </div>

                  <LunaFileUpload
                    label="Audio File"
                    helperText="Supported formats: MP3, WAV, OGG, M4A (max 10MB)"
                    accept="audio/*"
                    maxSize={10 * 1024 * 1024}
                    multiple={false}
                    onFilesChange={(files) => setNewAudioFile(files[0] || null)}
                  />

                  {newAudioFile && (
                    <div className="p-3 bg-white border border-luna-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4 text-luna-blue" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-luna-gray-900 truncate">
                            {newAudioFile.name}
                          </p>
                          <p className="text-xs text-luna-gray-500">
                            {(newAudioFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <LunaTextarea
                    label="Transcript"
                    placeholder="Enter the exact text spoken in this audio file..."
                    value={newTranscript}
                    onChange={(e) => setNewTranscript(e.target.value)}
                    rows={6}
                    required
                    helperText="This text will be used to calculate accuracy when users transcribe the audio"
                  />

                  <div className="flex gap-2 pt-2">
                    <LunaButton
                      type="button"
                      variant="primary"
                      onClick={handleAddAudioFile}
                      disabled={!newAudioFile || !newTranscript.trim()}
                      icon={<Check className="h-4 w-4" />}
                    >
                      Save Audio File
                    </LunaButton>
                    <LunaButton
                      type="button"
                      variant="ghost"
                      onClick={handleCancelAdd}
                      icon={<X className="h-4 w-4" />}
                    >
                      Cancel
                    </LunaButton>
                  </div>
                </div>
              )}

              {audioFilesWithTranscripts.length === 0 && !isAddingNew && (
                <div className="text-center py-8 border-2 border-dashed border-luna-gray-200 rounded-lg">
                  <FileAudio className="h-12 w-12 text-luna-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-luna-gray-600 mb-1">No audio files added yet</p>
                  <p className="text-xs text-luna-gray-500">Click "Add Audio File" to get started</p>
                </div>
              )}
            </div>
          )}
        </LunaDialogBody>

        {/* Sticky Footer */}
        <LunaDialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <LunaButton
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || loading}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </LunaButton>
          </div>

          <div className="text-sm text-luna-gray-600">
            Step {currentStep + 1} of {totalSteps}
          </div>

          <div className="flex gap-2">
            {currentStep < totalSteps - 1 ? (
              <LunaButton
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={(currentStep === 1 && !canProceed) || loading}
              >
                Next
              </LunaButton>
            ) : (
              <LunaButton
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={
                  isKnowledgeTest
                    ? knowledgeQuestions.length === 0
                    : isTranscription
                    ? audioFilesWithTranscripts.length === 0 || isAddingNew
                    : !canProceed
                }
                loading={loading}
              >
                Create Assessment
              </LunaButton>
            )}
            <LunaButton
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </LunaButton>
          </div>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

