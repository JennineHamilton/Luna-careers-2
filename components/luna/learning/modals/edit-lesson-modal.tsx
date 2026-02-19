/**
 * Edit Lesson Modal
 * Modal for editing existing SCORM lessons
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
  LunaFileUpload,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type LessonUpdate = Database['public']['Tables']['lessons']['Update'];
type Creator = Database['public']['Tables']['creators']['Row'];
type ExtractionStatus = 'idle' | 'uploading' | 'extracting' | 'completed' | 'failed';

const SCORM_VERSIONS = [
  { value: '1.2', label: 'SCORM 1.2' },
  { value: '2004', label: 'SCORM 2004' },
] as const;

interface EditLessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  lesson: Lesson | null;
}

export function EditLessonModal({
  open,
  onOpenChange,
  onSuccess,
  lesson,
}: EditLessonModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('idle');
  const [extractionProgress, setExtractionProgress] = useState('');
  const [newScormUrl, setNewScormUrl] = useState<string | null>(null);

  const [lessonData, setLessonData] = useState<LessonUpdate>({
    title: '',
    description: null,
    scorm_package_url: '',
    scorm_version: '1.2',
    duration_minutes: 0,
    creator_id: null,
  });

  // Load lesson data when modal opens
  useEffect(() => {
    if (open && lesson) {
      setLessonData({
        title: lesson.title,
        description: lesson.description,
        scorm_package_url: lesson.scorm_package_url,
        scorm_version: lesson.scorm_version,
        duration_minutes: lesson.duration_minutes,
        creator_id: lesson.creator_id,
      });
    }
  }, [open, lesson]);

  // Fetch creators on mount
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('creators')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setCreators(data || []);
      } catch (err) {
        console.error('Error fetching creators:', err);
      }
    };

    if (open) {
      fetchCreators();
    }
  }, [open]);

  // Handle SCORM package upload and extraction (for replacement)
  const handleScormUpload = async () => {
    if (!scormFile || !lesson) return;

    setError('');
    setExtractionStatus('uploading');
    setExtractionProgress('Uploading new SCORM package...');

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in');
        setExtractionStatus('failed');
        return;
      }

      // Upload SCORM package
      const fileExt = scormFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('scorm-packages')
        .upload(filePath, scormFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError(`Failed to upload SCORM package: ${uploadError.message}`);
        setExtractionStatus('failed');
        return;
      }

      const uploadedPath = uploadData.path;
      setNewScormUrl(uploadedPath);

      // Update lesson with new SCORM package URL
      setExtractionProgress('Updating lesson record...');
      const updateResponse = await fetch(`/api/learning/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          scorm_package_url: uploadedPath,
        }),
      });

      if (!updateResponse.ok) {
        setError('Failed to update lesson with new package');
        setExtractionStatus('failed');
        return;
      }

      // Start extraction
      setExtractionStatus('extracting');
      setExtractionProgress('Extracting SCORM package... This may take 15-20 seconds.');

      const extractResponse = await fetch('/api/learning/scorm/extract-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          scormPath: uploadedPath,
        }),
      });

      if (!extractResponse.ok) {
        setError('Failed to extract SCORM package');
        setExtractionStatus('failed');
        return;
      }

      // Delete old SCORM package
      if (lessonData.scorm_package_url) {
        let oldPath = lessonData.scorm_package_url;
        if (oldPath.includes('scorm-packages')) {
          const match = oldPath.match(/\/scorm-packages\/(.+?)(?:\?|$)/);
          if (match && match[1]) {
            oldPath = match[1];
          }
        }
        await supabase.storage.from('scorm-packages').remove([oldPath]);
      }

      // Success!
      setExtractionStatus('completed');
      setExtractionProgress('SCORM package extracted successfully!');
    } catch (err) {
      console.error('Error uploading SCORM:', err);
      setError('An error occurred during upload. Please try again.');
      setExtractionStatus('failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!lesson) {
      setError('No lesson selected');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in');
        setLoading(false);
        return;
      }

      // Update lesson details
      const response = await fetch(`/api/learning/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: lessonData.title,
          description: lessonData.description || null,
          duration_minutes: lessonData.duration_minutes,
          creator_id: lessonData.creator_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update lesson');
        setLoading(false);
        return;
      }

      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error updating lesson:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setScormFile(null);
    setError('');
    setLoading(false);
    setExtractionStatus('idle');
    setExtractionProgress('');
    setNewScormUrl(null);
    onOpenChange(false);
  };

  if (!lesson) return null;

  return (
    <LunaDialog open={open} onOpenChange={handleClose}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Edit Lesson
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update lesson details and SCORM package
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LunaInput
                label="Lesson Title"
                required
                value={lessonData.title}
                onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                placeholder="e.g., Introduction to JavaScript"
              />

              <LunaSelect
                label="SCORM Version"
                required
                value={lessonData.scorm_version}
                onValueChange={(value) => setLessonData({ ...lessonData, scorm_version: value })}
              >
                {SCORM_VERSIONS.map((version) => (
                  <LunaSelectItem key={version.value} value={version.value}>
                    {version.label}
                  </LunaSelectItem>
                ))}
              </LunaSelect>
            </div>

            <LunaTextarea
              label="Description"
              value={lessonData.description || ''}
              onChange={(e) => setLessonData({ ...lessonData, description: e.target.value || null })}
              placeholder="Brief description of the lesson content"
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LunaInput
                label="Duration (minutes)"
                type="number"
                required
                min={0}
                value={lessonData.duration_minutes}
                onChange={(e) => setLessonData({ ...lessonData, duration_minutes: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 30"
              />

              <LunaSelect
                label="Creator (Optional)"
                value={lessonData.creator_id || ''}
                onValueChange={(value) => setLessonData({ ...lessonData, creator_id: value || null })}
                placeholder="Select a creator"
              >
                {creators.map((creator) => (
                  <LunaSelectItem key={creator.id} value={creator.id}>
                    {creator.name} {creator.verified && '✓'}
                  </LunaSelectItem>
                ))}
              </LunaSelect>
            </div>

            <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  !
                </div>
                <h3 className="text-sm font-semibold text-amber-900">Replace SCORM Package (Optional)</h3>
              </div>

              <LunaFileUpload
                label="New SCORM Package"
                accept=".zip"
                maxSize={100 * 1024 * 1024} // 100MB
                helperText="Upload a new ZIP file to replace the current SCORM package (max. 100MB)"
                onFilesChange={(files) => setScormFile(files[0] || null)}
                disabled={extractionStatus !== 'idle'}
              />

              {scormFile && extractionStatus === 'idle' && (
                <div className="flex items-center gap-2 p-3 bg-white border border-amber-200 rounded-lg">
                  <div className="shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-900 truncate">{scormFile.name}</p>
                    <p className="text-xs text-amber-700">
                      {(scormFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <LunaButton
                    type="button"
                    size="sm"
                    onClick={handleScormUpload}
                  >
                    Replace & Extract
                  </LunaButton>
                </div>
              )}

              {/* Extraction Progress */}
              {extractionStatus === 'uploading' && (
                <div className="flex items-center gap-3 p-3 bg-white border border-amber-200 rounded-lg">
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">Uploading...</p>
                    <p className="text-xs text-amber-700">{extractionProgress}</p>
                  </div>
                </div>
              )}

              {extractionStatus === 'extracting' && (
                <div className="flex items-center gap-3 p-3 bg-white border border-amber-200 rounded-lg">
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">Extracting SCORM Package...</p>
                    <p className="text-xs text-amber-700">{extractionProgress}</p>
                  </div>
                </div>
              )}

              {extractionStatus === 'completed' && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Replacement Complete!</p>
                    <p className="text-xs text-green-700">{extractionProgress}</p>
                  </div>
                </div>
              )}

              {extractionStatus === 'failed' && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Replacement Failed</p>
                    <p className="text-xs text-red-700">Please try again with a different package</p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading || extractionStatus === 'uploading' || extractionStatus === 'extracting'}
          >
            Cancel
          </LunaButton>
          <LunaButton
            type="submit"
            onClick={handleSubmit}
            disabled={loading || extractionStatus === 'uploading' || extractionStatus === 'extracting'}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

