/**
 * Add Introduction Video Modal
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
  LunaFileUpload,
} from '@/components/luna';
import { LunaVideoRecorder } from '@/components/luna/video-recorder';
import { Loader2, Video, Upload, VideoIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AddVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddVideoModal({ open, onOpenChange, onSuccess }: AddVideoModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');

  const handleRecordingComplete = (blob: Blob) => {
    setRecordedBlob(blob);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if we have either a file or a recording
    if (videoFiles.length === 0 && !recordedBlob) return;

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      // Get session to ensure we have a valid auth context
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const user = session.user;

      // Determine the video source (uploaded file or recorded blob)
      let videoFile: File | Blob;
      let fileExt: string;

      if (activeTab === 'upload' && videoFiles.length > 0) {
        videoFile = videoFiles[0];
        fileExt = videoFiles[0].name.split('.').pop() || 'mp4';
      } else if (activeTab === 'record' && recordedBlob) {
        videoFile = recordedBlob;
        fileExt = 'webm';
      } else {
        throw new Error('No video to upload');
      }

      // Upload video to storage with user ID folder structure
      const fileName = `${user.id}/intro-video-${Date.now()}.${fileExt}`;

      console.log('🎥 Video Upload Debug:');
      console.log('  User ID:', user.id);
      console.log('  File name:', fileName);
      console.log('  File type:', videoFile.type);
      console.log('  File size:', videoFile.size, 'bytes');
      console.log('  Session exists:', !!session);
      console.log('  Source:', activeTab);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-credentials')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: true // Allow overwriting if file exists
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        console.error('  Error message:', uploadError.message);
        console.error('  Full error:', JSON.stringify(uploadError, null, 2));
        throw new Error(uploadError.message || 'Failed to upload video');
      }

      console.log('✅ Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-credentials')
        .getPublicUrl(fileName);

      // Update user profile with video URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ intro_video_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setLoading(false);
      onOpenChange(false);
      setVideoFiles([]);
      setRecordedBlob(null);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.error('Error uploading video:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-3xl">
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Add Introduction Video
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            Upload or record a 30-60 second video introducing yourself
          </LunaDialogDescription>
        </LunaDialogHeader>

        <form onSubmit={handleSubmit}>
          <LunaDialogBody>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-luna-red-50 border border-luna-red-200 rounded-lg text-sm text-luna-red-700">
                  {error}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-2 border-b border-luna-border-default">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'upload'
                      ? 'border-luna-blue text-luna-blue'
                      : 'border-transparent text-luna-gray-600 hover:text-luna-gray-900'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload Video
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('record')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'record'
                      ? 'border-luna-blue text-luna-blue'
                      : 'border-transparent text-luna-gray-600 hover:text-luna-gray-900'
                  }`}
                >
                  <VideoIcon className="w-4 h-4 inline mr-2" />
                  Record Video
                </button>
              </div>

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <LunaFileUpload
                    label="Video File"
                    accept="video/*"
                    maxSize={50 * 1024 * 1024} // 50MB
                    helperText="MP4, MOV, or AVI (max. 50MB)"
                    onFilesChange={setVideoFiles}
                  />
                </div>
              )}

              {/* Record Tab */}
              {activeTab === 'record' && (
                <div className="space-y-4">
                  <LunaVideoRecorder
                    maxDuration={60}
                    onRecordingComplete={handleRecordingComplete}
                  />
                </div>
              )}

              {/* Tips */}
              <div className="p-4 bg-luna-blue-50 border border-luna-blue-200 rounded-lg">
                <p className="text-sm font-medium text-luna-blue-900 mb-2">Tips for a great intro video:</p>
                <ul className="text-sm text-luna-blue-700 space-y-1 list-disc list-inside">
                  <li>Keep it between 30-60 seconds</li>
                  <li>Introduce yourself and your profession</li>
                  <li>Mention your key skills and experience</li>
                  <li>Speak clearly and maintain eye contact</li>
                  <li>Use good lighting and a clean background</li>
                </ul>
              </div>
            </div>
          </LunaDialogBody>

          <LunaDialogFooter>
            <LunaButton
              type="button"
              variant="secondary"
              onClick={() => {
                onOpenChange(false);
                setVideoFiles([]);
                setRecordedBlob(null);
              }}
              disabled={loading}
            >
              Cancel
            </LunaButton>
            <LunaButton
              type="submit"
              variant="primary"
              disabled={loading || (activeTab === 'upload' && videoFiles.length === 0) || (activeTab === 'record' && !recordedBlob)}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {activeTab === 'upload' ? 'Upload Video' : 'Save Recording'}
            </LunaButton>
          </LunaDialogFooter>
        </form>
      </LunaDialogContent>
    </LunaDialog>
  );
}

