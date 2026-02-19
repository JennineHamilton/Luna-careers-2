'use client';

import * as React from 'react';
import { Video, Square, Play, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaButton } from './button';

export interface LunaVideoRecorderProps {
  /** Callback when recording is complete */
  onRecordingComplete?: (blob: Blob) => void;
  /** Maximum recording duration in seconds */
  maxDuration?: number;
  /** Additional className */
  className?: string;
}

/**
 * LunaVideoRecorder - Browser-based video recorder component.
 *
 * @example
 * ```tsx
 * <LunaVideoRecorder
 *   maxDuration={60}
 *   onRecordingComplete={(blob) => handleVideoBlob(blob)}
 * />
 * ```
 */
export function LunaVideoRecorder({
  onRecordingComplete,
  maxDuration = 60,
  className,
}: LunaVideoRecorderProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = React.useState(false);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [error, setError] = React.useState<string>('');
  const [isInitializing, setIsInitializing] = React.useState(false);

  // Timer for recording duration
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxDuration]);

  const startCamera = async () => {
    setIsInitializing(true);
    setError('');
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Edge.');
      }

      // Check if we're on a secure context
      const isSecureContext = window.isSecureContext;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (!isSecureContext && !isLocalhost) {
        throw new Error('INSECURE_CONTEXT');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      let errorMessage = 'Unable to access camera. ';

      // Check for insecure context first
      if (err.message === 'INSECURE_CONTEXT' || err.name === 'SecurityError') {
        const currentUrl = window.location.href;
        const isHttp = currentUrl.startsWith('http://') && !currentUrl.includes('localhost');

        if (isHttp) {
          errorMessage = 'Camera access requires a secure connection (HTTPS) or localhost. ';
          errorMessage += `\n\nCurrent URL: ${currentUrl}\n\n`;
          errorMessage += 'Solutions:\n';
          errorMessage += '1. Access via http://localhost:3000 instead of http://127.0.0.1:3000\n';
          errorMessage += '2. Or set up HTTPS for local development\n';
          errorMessage += '3. Or upload a pre-recorded video instead';
        } else {
          errorMessage += 'Camera access is blocked due to security settings.';
        }
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        // Check if this might be due to insecure context
        const currentUrl = window.location.href;
        const isNonLocalhost = currentUrl.startsWith('http://') && !currentUrl.includes('localhost');

        if (isNonLocalhost) {
          errorMessage = 'Camera access requires a secure connection. ';
          errorMessage += `\n\nYou're accessing via: ${currentUrl}\n\n`;
          errorMessage += 'Please use one of these instead:\n';
          errorMessage += '• http://localhost:3000 (recommended for development)\n';
          errorMessage += '• https:// (for production)\n\n';
          errorMessage += 'Or switch to the "Upload Video" tab to upload a pre-recorded video.';
        } else {
          errorMessage += 'Camera permission was denied. ';
          errorMessage += '\n\nTo fix this:\n';
          errorMessage += '1. Look for the camera icon (🎥) in your browser\'s address bar\n';
          errorMessage += '2. Click it and select "Allow"\n';
          errorMessage += '3. Click "Try Again" below\n\n';
          errorMessage += 'Or go to your browser settings and allow camera access for this site.';
        }
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application. Please close other apps using the camera and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not meet the required specifications. Please try a different camera.';
      } else {
        errorMessage += err.message || 'Please check your camera permissions and try again.';
      }

      setError(errorMessage);
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setIsPreviewing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = URL.createObjectURL(blob);
      }
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setIsPreviewing(false);
    setRecordingTime(0);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
    startCamera();
  };

  const useRecording = () => {
    if (recordedBlob) {
      onRecordingComplete?.(recordedBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div data-slot="luna-video-recorder" className={cn('flex flex-col gap-4', className)}>
      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!isPreviewing}
          controls={isPreviewing}
          className="w-full h-full object-cover"
        />

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">REC {formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Max duration indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
            {formatTime(maxDuration - recordingTime)} left
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6 overflow-y-auto">
            <div className="text-left text-white max-w-lg">
              <div className="mb-4 text-center">
                <Video className="w-12 h-12 mx-auto mb-3 text-red-400" />
                <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
              </div>
              <div className="text-sm mb-4 leading-relaxed whitespace-pre-line bg-black/40 p-4 rounded-lg border border-red-500/30">
                {error}
              </div>
              <div className="space-y-2">
                <LunaButton variant="secondary" size="sm" onClick={startCamera} className="w-full">
                  Try Again
                </LunaButton>
              </div>
            </div>
          </div>
        )}

        {/* Initializing message */}
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Accessing camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!streamRef.current && !isPreviewing && !isInitializing && (
          <LunaButton onClick={startCamera} variant="primary">
            <Video className="w-4 h-4 mr-2" />
            Start Camera
          </LunaButton>
        )}

        {streamRef.current && !isRecording && !isPreviewing && (
          <LunaButton onClick={startRecording} variant="primary">
            <Video className="w-4 h-4 mr-2" />
            Start Recording
          </LunaButton>
        )}

        {isRecording && (
          <LunaButton onClick={stopRecording} variant="danger">
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </LunaButton>
        )}

        {isPreviewing && (
          <>
            <LunaButton onClick={discardRecording} variant="secondary">
              <Trash2 className="w-4 h-4 mr-2" />
              Discard
            </LunaButton>
            <LunaButton onClick={useRecording} variant="primary">
              <Play className="w-4 h-4 mr-2" />
              Use This Recording
            </LunaButton>
          </>
        )}
      </div>

      {/* Helper text */}
      {!isPreviewing && (
        <div className="text-center text-sm text-luna-gray-600">
          {!streamRef.current && !isInitializing && 'Click "Start Camera" to begin recording'}
          {streamRef.current && !isRecording && `Record up to ${formatTime(maxDuration)}`}
          {isRecording && 'Recording in progress...'}
        </div>
      )}
    </div>
  );
}

