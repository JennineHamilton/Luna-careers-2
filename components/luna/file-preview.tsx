'use client';

import * as React from 'react';
import { FileText, Download, X, Image as ImageIcon, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaButton } from './button';

export interface LunaFilePreviewProps {
  /** File URL or File object */
  file: string | File;
  /** File name (required if file is a URL) */
  fileName?: string;
  /** File type (auto-detected from File object or extension) */
  fileType?: string;
  /** Show download button */
  showDownload?: boolean;
  /** Show close button */
  showClose?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Download handler */
  onDownload?: () => void;
  /** Maximum height */
  maxHeight?: number;
  /** Additional class name */
  className?: string;
}

/**
 * LunaFilePreview - File preview component for resumes, certificates, and documents.
 *
 * @example
 * ```tsx
 * <LunaFilePreview
 *   file="/documents/resume.pdf"
 *   fileName="John_Doe_Resume.pdf"
 *   showDownload
 *   showClose
 *   onClose={() => setShowPreview(false)}
 * />
 * ```
 */
export function LunaFilePreview({
  file,
  fileName,
  fileType,
  showDownload = true,
  showClose = false,
  onClose,
  onDownload,
  maxHeight = 600,
  className,
}: LunaFilePreviewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string>('');
  const [name, setName] = React.useState<string>('');
  const [type, setType] = React.useState<string>('');

  React.useEffect(() => {
    if (typeof file === 'string') {
      setPreviewUrl(file);
      setName(fileName || file.split('/').pop() || 'file');
      setType(fileType || getFileTypeFromUrl(file));
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setName(file.name);
      setType(file.type || getFileTypeFromName(file.name));

      return () => URL.revokeObjectURL(url);
    }
  }, [file, fileName, fileType]);

  const getFileTypeFromUrl = (url: string): string => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    return 'unknown';
  };

  const getFileTypeFromName = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    return 'unknown';
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = name;
      link.click();
    }
  };

  const renderPreview = () => {
    if (type.startsWith('image') || type === 'image') {
      return (
        <img
          src={previewUrl}
          alt={name}
          className="max-w-full h-auto object-contain"
          style={{ maxHeight }}
        />
      );
    }

    if (type === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          title={name}
          className="w-full border-0"
          style={{ height: maxHeight }}
        />
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <File className="w-16 h-16 text-luna-gray-400 mb-4" />
        <p className="text-luna-gray-900 font-medium mb-2">{name}</p>
        <p className="text-sm text-luna-gray-600 mb-4">
          Preview not available for this file type
        </p>
        {showDownload && (
          <LunaButton onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
            Download File
          </LunaButton>
        )}
      </div>
    );
  };

  return (
    <div className={cn('bg-white rounded-lg border border-luna-gray-200', className)} data-slot="luna-file-preview">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-luna-gray-200">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {type.startsWith('image') || type === 'image' ? (
            <ImageIcon className="w-5 h-5 text-luna-gray-600 shrink-0" />
          ) : (
            <FileText className="w-5 h-5 text-luna-gray-600 shrink-0" />
          )}
          <span className="text-sm font-medium text-luna-gray-900 truncate">{name}</span>
        </div>

        <div className="flex items-center gap-2">
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 hover:bg-luna-gray-100 rounded transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4 text-luna-gray-600" />
            </button>
          )}
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-luna-gray-100 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-luna-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4 bg-luna-gray-50 flex items-center justify-center">
        {renderPreview()}
      </div>
    </div>
  );
}

