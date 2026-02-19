'use client';

import * as React from 'react';
import { Upload, X, File, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaButton } from './button';

export interface LunaFileUploadProps {
  /** Label for the upload area */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Accepted file types (e.g., 'image/*', '.pdf,.doc') */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allow multiple files */
  multiple?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Callback when files are selected */
  onFilesChange?: (files: File[]) => void;
  /** Additional className */
  className?: string;
}

/**
 * LunaFileUpload - Drag and drop file upload component.
 *
 * @example
 * ```tsx
 * <LunaFileUpload
 *   label="Upload Documents"
 *   accept=".pdf,.doc,.docx"
 *   maxSize={5 * 1024 * 1024} // 5MB
 *   multiple
 *   onFilesChange={(files) => console.log(files)}
 * />
 * ```
 */
export function LunaFileUpload({
  label,
  helperText,
  error,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  disabled = false,
  onFilesChange,
  className,
}: LunaFileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadError, setUploadError] = React.useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const validateFiles = (fileList: FileList | null): File[] => {
    if (!fileList) return [];

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach((file) => {
      if (maxSize && file.size > maxSize) {
        errors.push(`${file.name} exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setUploadError(errors[0]);
    } else {
      setUploadError('');
    }

    return validFiles;
  };

  const handleFiles = (fileList: FileList | null) => {
    const validFiles = validateFiles(fileList);
    if (validFiles.length > 0) {
      const newFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(newFiles);
      onFilesChange?.(newFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange?.(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (file.type.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div data-slot="luna-file-upload" className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-luna-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging && !disabled && 'border-luna-blue bg-luna-blue/5',
          !isDragging && !disabled && 'border-luna-gray-300 hover:border-luna-gray-400',
          disabled && 'border-luna-gray-200 bg-luna-gray-50 cursor-not-allowed opacity-60',
          error && 'border-red-300'
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          className="hidden"
        />

        <Upload className={cn('w-10 h-10 mx-auto mb-3', disabled ? 'text-luna-gray-400' : 'text-luna-gray-500')} />
        <p className="text-sm font-medium text-luna-gray-900 mb-1">
          {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-luna-gray-600">
          {helperText || `Maximum file size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-luna-gray-50 rounded-md border border-luna-gray-200"
            >
              <div className="text-luna-gray-600">{getFileIcon(file)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-luna-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-luna-gray-600">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="text-luna-gray-400 hover:text-luna-gray-600 transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {(error || uploadError) && (
        <p className="mt-2 text-sm text-red-600">{error || uploadError}</p>
      )}
    </div>
  );
}

