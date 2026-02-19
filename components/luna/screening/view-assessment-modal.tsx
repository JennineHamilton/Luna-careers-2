'use client';

/**
 * View Assessment Modal - View assessment details and statistics
 */

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
  LunaBadge,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Keyboard, Play, Clock, Globe, Mic, Users, TrendingUp, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils/formatters';
import type { Database } from '@/types/database.types';

type AssessmentTemplate = Database['public']['Tables']['assessment_templates']['Row'];
type AssessmentAudioFile = Database['public']['Tables']['assessment_audio_files']['Row'];

export interface ViewAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  assessmentId: string;
}

export function ViewAssessmentModal({ open, onClose, assessmentId }: ViewAssessmentModalProps) {
  const [assessment, setAssessment] = useState<AssessmentTemplate | null>(null);
  const [audioFiles, setAudioFiles] = useState<AssessmentAudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && assessmentId) {
      loadAssessmentData();
    }
  }, [open, assessmentId]);

  const loadAssessmentData = async () => {
    setLoading(true);
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
      setAssessment(assessment);

      // If transcription, load audio files
      if (assessment.has_audio) {
        const audioResponse = await fetch(`/api/screening/assessments/${assessmentId}/audio`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (audioResponse.ok) {
          const { audio_files } = await audioResponse.json();
          setAudioFiles(audio_files || []);
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading assessment:', err);
      setError(err.message || 'Failed to load assessment');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onClose}>
      <LunaDialogContent className="max-w-3xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-luna-blue" />
            Assessment Details
          </LunaDialogTitle>
          <LunaDialogDescription>
            View assessment configuration and statistics
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm max-h-[calc(100vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-luna-gray-600">Loading assessment data...</div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : assessment ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-luna-gray-900 mb-4">{assessment.title}</h3>
                {assessment.description && (
                  <p className="text-luna-gray-600 mb-4">{assessment.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4 text-luna-gray-400" />
                    <div>
                      <p className="text-xs text-luna-gray-500">Type</p>
                      <p className="text-sm font-medium text-luna-gray-900 capitalize">
                        {assessment.has_audio ? 'Transcription' : assessment.assessment_type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-luna-gray-400" />
                    <div>
                      <p className="text-xs text-luna-gray-500">Language</p>
                      <p className="text-sm font-medium text-luna-gray-900 uppercase">
                        {assessment.language}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-luna-gray-400" />
                    <div>
                      <p className="text-xs text-luna-gray-500">Duration</p>
                      <p className="text-sm font-medium text-luna-gray-900">
                        {assessment.duration_seconds} seconds
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4" />
                    <div>
                      <p className="text-xs text-luna-gray-500">Status</p>
                      <LunaBadge variant={assessment.is_active ? 'success' : 'default'}>
                        {assessment.is_active ? 'Active' : 'Inactive'}
                      </LunaBadge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Files */}
              {assessment.has_audio && audioFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-luna-gray-900 mb-3 flex items-center gap-2">
                    <Mic className="h-4 w-4 text-luna-blue" />
                    Audio Files ({audioFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {audioFiles.map((audioFile) => (
                      <div
                        key={audioFile.id}
                        className="flex items-center justify-between p-3 border border-luna-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Play className="h-4 w-4 text-luna-blue" />
                          <div>
                            <p className="text-sm font-medium text-luna-gray-900">
                              {audioFile.file_name}
                            </p>
                            <p className="text-xs text-luna-gray-600">
                              {audioFile.file_size ? `${(audioFile.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                              {audioFile.duration_seconds && ` • ${audioFile.duration_seconds}s`}
                            </p>
                          </div>
                        </div>
                        <LunaBadge variant={audioFile.is_active ? 'success' : 'default'}>
                          {audioFile.is_active ? 'Active' : 'Inactive'}
                        </LunaBadge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t border-luna-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-luna-gray-900 mb-3">Metadata</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-luna-gray-500">Created</p>
                    <p className="text-luna-gray-900">{assessment.created_at ? formatDateTime(assessment.created_at) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-luna-gray-500">Last Updated</p>
                    <p className="text-luna-gray-900">{assessment.updated_at ? formatDateTime(assessment.updated_at) : '-'}</p>
                  </div>
                  {assessment.display_order !== null && (
                    <div>
                      <p className="text-luna-gray-500">Display Order</p>
                      <p className="text-luna-gray-900">{assessment.display_order}</p>
                    </div>
                  )}
                  {assessment.category && (
                    <div>
                      <p className="text-luna-gray-500">Category</p>
                      <p className="text-luna-gray-900 capitalize">{assessment.category}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </LunaDialogBody>

        <LunaDialogFooter className="flex items-center justify-end">
          <LunaButton
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Close
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}
