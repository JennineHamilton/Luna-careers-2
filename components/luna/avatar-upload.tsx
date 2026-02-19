'use client';

import * as React from 'react';
import { Camera, X, Upload } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface LunaAvatarUploadProps {
  /** Current avatar URL */
  value?: string;
  /** Callback when avatar changes */
  onChange?: (file: File | null) => void;
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Disabled state */
  disabled?: boolean;
  /** Label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Additional className */
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/**
 * LunaAvatarUpload - Profile image upload component with empty state.
 *
 * @example
 * ```tsx
 * <LunaAvatarUpload
 *   label="Profile Picture"
 *   size="lg"
 *   value={avatarUrl}
 *   onChange={(file) => handleUpload(file)}
 * />
 * ```
 */
export function LunaAvatarUpload({
  value,
  onChange,
  size = 'lg',
  disabled = false,
  label,
  helperText,
  error,
  className,
}: LunaAvatarUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(value || null);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setPreview(null);
      onChange?.(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange?.(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
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
      const file = e.dataTransfer.files[0];
      if (file) handleFileChange(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange?.(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div data-slot="luna-avatar-upload" className={cn('flex flex-col', className)}>
      {label && (
        <label className="block text-sm font-medium text-luna-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="flex items-center gap-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'relative rounded-full overflow-hidden flex-shrink-0 cursor-pointer group',
            sizeClasses[size],
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            disabled={disabled}
            onChange={handleInputChange}
            className="hidden"
          />

          {preview ? (
            <>
              <Image src={preview} alt="Avatar preview" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className={cn('text-white', iconSizes[size])} />
              </div>
            </>
          ) : (
            <div
              className={cn(
                'w-full h-full flex items-center justify-center transition-colors',
                isDragging ? 'bg-luna-blue/10 border-2 border-luna-blue' : 'bg-luna-gray-100 border-2 border-luna-gray-300',
                !disabled && 'group-hover:bg-luna-gray-200'
              )}
            >
              <Upload className={cn('text-luna-gray-500', iconSizes[size])} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => !disabled && inputRef.current?.click()}
              disabled={disabled}
              className="text-sm font-medium text-luna-blue hover:text-luna-blue/80 disabled:text-luna-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {preview ? 'Change' : 'Upload'}
            </button>
            {preview && (
              <>
                <span className="text-luna-gray-400">•</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:text-luna-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Remove
                </button>
              </>
            )}
          </div>
          {helperText && (
            <p className="text-xs text-luna-gray-600 mt-1">{helperText}</p>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
