'use client';

/**
 * Edit Assessment Modal - Edit existing assessment
 * Pre-populates form with existing data
 * Allows editing all fields and managing audio files
 */

import { useState, useCallback, useEffect } from 'react';
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
import { Keyboard, ChevronLeft, Trash2, Play, Plus, FileAudio, Edit2, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TypingAssessmentForm } from './typing-assessment-form';
import type { Database } from '@/types/database.types';

type AssessmentTemplate = Database['public']['Tables']['assessment_templates']['Row'];
type AssessmentAudioFile = Database['public']['Tables']['assessment_audio_files']['Row'];

export interface EditAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assessmentId: string;
}

const BASE_STEPS = [
  { label: 'Configure', description: 'Edit assessment settings' },
];

const TRANSCRIPTION_STEPS = [
  { label: 'Configure', description: 'Edit assessment settings' },
  { label: 'Audio Files', description: 'Manage audio files' },
];

export interface FormData {
  title: string;
  description: string;
  duration: string;
  language: string;
  typingType: 'basic' | 'transcription';
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

// Existing Audio File Accordion Item Component (for files already in database)
function ExistingAudioFileAccordionItem({
  item,
  onDelete,
  onEdit,
  onSave,
  onCancel,
}: {
  item: AssessmentAudioFile & { isEditing?: boolean };
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onSave: (id: string, transcript: string) => void;
  onCancel: (id: string) => void;
}) {
  const [editedTranscript, setEditedTranscript] = useState(item.transcript || '');

  return (
    <LunaAccordionItem value={item.id} className="border border-luna-gray-200 rounded-lg px-4">
      <LunaAccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 flex-1 text-left">
          <FileAudio className="h-4 w-4 text-luna-green shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-luna-gray-900 truncate">
              {item.file_name}
            </p>
            <p className="text-xs text-luna-gray-500">
              {item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} • Transcript: {(item.transcript || '').length} characters
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
                    setEditedTranscript(item.transcript || '');
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
                    {item.transcript || 'No transcript available'}
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

export function EditAssessmentModal({ open, onClose, onSuccess, assessmentId }: EditAssessmentModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTranscription, setIsTranscription] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [audioFilesWithTranscripts, setAudioFilesWithTranscripts] = useState<AudioFileWithTranscript[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [newTranscript, setNewTranscript] = useState('');
  const [existingAudioFiles, setExistingAudioFiles] = useState<AssessmentAudioFile[]>([]);
  const [audioFilesToDelete, setAudioFilesToDelete] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [initialFormData, setInitialFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  const steps = isTranscription ? TRANSCRIPTION_STEPS : BASE_STEPS;
  const totalSteps = steps.length;

  // Load assessment data
  useEffect(() => {
    if (open && assessmentId) {
      loadAssessmentData();
    }
  }, [open, assessmentId]);

  const loadAssessmentData = async () => {
    setLoadingData(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Fetch assessment
      const response = await fetch(`/api/screening/assessments/${assessmentId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load assessment');
      }

      const { assessment } = await response.json();

      // Set initial form data
      const initialData: FormData = {
        title: assessment.title,
        description: assessment.description || '',
        duration: assessment.duration_seconds.toString(),
        language: assessment.language,
        typingType: assessment.has_audio ? 'transcription' : 'basic',
      };

      setInitialFormData(initialData);
      setFormData(initialData);
      setIsTranscription(assessment.has_audio);

      // If transcription, load audio files
      if (assessment.has_audio) {
        const audioResponse = await fetch(`/api/screening/assessments/${assessmentId}/audio`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (audioResponse.ok) {
          const { audio_files } = await audioResponse.json();
          setExistingAudioFiles(audio_files || []);
        }
      }

      setLoadingData(false);
    } catch (err: any) {
      console.error('Error loading assessment:', err);
      setError(err.message || 'Failed to load assessment');
      setLoadingData(false);
    }
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
    setIsTranscription(false);
    setCanProceed(false);
    setAudioFilesWithTranscripts([]);
    setIsAddingNew(false);
    setNewAudioFile(null);
    setNewTranscript('');
    setExistingAudioFiles([]);
    setAudioFilesToDelete([]);
    setFormData(null);
    setInitialFormData(null);
    setError('');
    setLoading(false);
    setLoadingData(true);
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

  // New audio file handlers
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

  const handleDeleteNewAudioFile = (id: string) => {
    setAudioFilesWithTranscripts(audioFilesWithTranscripts.filter(item => item.id !== id));
  };

  const handleEditNewAudioFile = (id: string) => {
    setAudioFilesWithTranscripts(audioFilesWithTranscripts.map(item =>
      item.id === id ? { ...item, isEditing: true } : item
    ));
  };

  const handleSaveEditNewAudioFile = (id: string, newTranscript: string) => {
    setAudioFilesWithTranscripts(audioFilesWithTranscripts.map(item =>
      item.id === id ? { ...item, transcript: newTranscript, isEditing: false } : item
    ));
  };

  const handleCancelEditNewAudioFile = (id: string) => {
    setAudioFilesWithTranscripts(audioFilesWithTranscripts.map(item =>
      item.id === id ? { ...item, isEditing: false } : item
    ));
  };

  // Existing audio file handlers
  const handleEditExistingAudioFile = (id: string) => {
    setExistingAudioFiles(existingAudioFiles.map(item =>
      item.id === id ? { ...item, isEditing: true } : item
    ));
  };

  const handleSaveEditExistingAudioFile = async (id: string, newTranscript: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/screening/assessments/${assessmentId}/audio/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ transcript: newTranscript }),
      });

      if (!response.ok) throw new Error('Failed to update transcript');

      setExistingAudioFiles(existingAudioFiles.map(item =>
        item.id === id ? { ...item, transcript: newTranscript, isEditing: false } : item
      ));
    } catch (err: any) {
      console.error('Error updating transcript:', err);
      setError(err.message || 'Failed to update transcript');
    }
  };

  const handleCancelEditExistingAudioFile = (id: string) => {
    setExistingAudioFiles(existingAudioFiles.map(item =>
      item.id === id ? { ...item, isEditing: false } : item
    ));
  };

  const handleDeleteAudioFile = async (audioFileId: string) => {
    if (!confirm('Are you sure you want to delete this audio file?')) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Delete from database (will cascade to storage via trigger or manual deletion)
      const { error } = await supabase
        .from('assessment_audio_files')
        .delete()
        .eq('id', audioFileId);

      if (error) throw error;

      // Remove from local state
      setExistingAudioFiles(prev => prev.filter(f => f.id !== audioFileId));
    } catch (err: any) {
      console.error('Error deleting audio file:', err);
      alert('Failed to delete audio file');
    }
  };

  const handleSubmit = async () => {
    if (!formData) return;

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Update assessment template
      const assessmentData = {
        title: formData.title,
        description: formData.description,
        language: formData.language,
        duration_seconds: parseInt(formData.duration),
        has_audio: formData.typingType === 'transcription',
      };

      const response = await fetch(`/api/screening/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(assessmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update assessment');
      }

      // If transcription and new audio files, upload them
      if (formData.typingType === 'transcription' && audioFilesWithTranscripts.length > 0) {
        await uploadAudioFiles(assessmentId, audioFilesWithTranscripts, session.access_token);
      }

      setLoading(false);
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating assessment:', err);
      setError(err.message || 'Failed to update assessment');
      setLoading(false);
    }
  };

  const uploadAudioFiles = async (assessmentId: string, items: AudioFileWithTranscript[], token: string) => {
    const supabase = createClient();

    for (const item of items) {
      const fileName = `${assessmentId}/${Date.now()}-${item.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assessment-audio')
        .upload(fileName, item.file);

      if (uploadError) {
        console.error('Error uploading audio file:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('assessment-audio')
        .getPublicUrl(fileName);

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

  return (
    <LunaDialog open={open} onOpenChange={handleClose}>
      <LunaDialogContent className="max-w-2xl">
        {/* Sticky Header */}
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-luna-blue" />
            Edit Assessment
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update assessment settings and manage audio files
          </LunaDialogDescription>
        </LunaDialogHeader>

        {/* Scrollable Body */}
        <LunaDialogBody className="text-sm max-h-[calc(100vh-200px)] overflow-y-auto">
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-luna-gray-600">Loading assessment data...</div>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Stepper */}
              <div className="mb-6">
                <LunaStepper steps={steps} currentStep={currentStep} />
              </div>

              {/* Step 1: Edit Form */}
              {currentStep === 0 && initialFormData && (
                <TypingAssessmentForm
                  onValidationChange={handleValidationChange}
                  onTranscriptionChange={handleTranscriptionChange}
                  onFormDataChange={handleFormDataChange}
                  initialData={initialFormData}
                />
              )}

              {/* Step 2: Audio File Management (only for transcription) */}
              {currentStep === 1 && isTranscription && (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-luna-gray-600 mb-2">
                      Manage audio files for transcription. Users will receive a random file each time they take the assessment.
                    </p>
                    <p className="text-xs text-luna-gray-500">
                      Each audio file must have a transcript for accuracy calculation.
                    </p>
                  </div>

                  {/* Existing Audio Files from Database */}
                  {existingAudioFiles.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-luna-gray-900">
                        Existing Audio Files ({existingAudioFiles.length})
                      </h3>
                      <LunaAccordion type="single" collapsible className="space-y-2">
                        {existingAudioFiles.map((item) => (
                          <ExistingAudioFileAccordionItem
                            key={item.id}
                            item={item}
                            onDelete={handleDeleteAudioFile}
                            onEdit={handleEditExistingAudioFile}
                            onSave={handleSaveEditExistingAudioFile}
                            onCancel={handleCancelEditExistingAudioFile}
                          />
                        ))}
                      </LunaAccordion>
                    </div>
                  )}

                  {/* New Audio Files to Upload */}
                  {audioFilesWithTranscripts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-luna-gray-900">
                        New Audio Files ({audioFilesWithTranscripts.length})
                      </h3>
                      <LunaAccordion type="single" collapsible className="space-y-2">
                        {audioFilesWithTranscripts.map((item) => (
                          <AudioFileAccordionItem
                            key={item.id}
                            item={item}
                            onDelete={handleDeleteNewAudioFile}
                            onEdit={handleEditNewAudioFile}
                            onSave={handleSaveEditNewAudioFile}
                            onCancel={handleCancelEditNewAudioFile}
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

                  {existingAudioFiles.length === 0 && audioFilesWithTranscripts.length === 0 && !isAddingNew && (
                    <div className="text-center py-8 border-2 border-dashed border-luna-gray-200 rounded-lg">
                      <FileAudio className="h-12 w-12 text-luna-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-luna-gray-600 mb-1">No audio files added yet</p>
                      <p className="text-xs text-luna-gray-500">Click "Add Audio File" to get started</p>
                    </div>
                  )}

                  <Alert>
                    <AlertDescription>
                      Users will receive a random audio file from this collection when they take the assessment.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </>
          )}
        </LunaDialogBody>

        {/* Sticky Footer */}
        <LunaDialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <LunaButton
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || loading || loadingData}
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
                disabled={!canProceed || loading || loadingData}
              >
                Next
              </LunaButton>
            ) : (
              <LunaButton
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={
                  !canProceed ||
                  loading ||
                  loadingData ||
                  isAddingNew
                }
                loading={loading}
              >
                Save Changes
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

