'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link2,
  Heading2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LunaRichTextEditorProps {
  /** Editor content (HTML) */
  value?: string;
  /** Content change handler */
  onChange?: (html: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Minimum height */
  minHeight?: number;
  /** Additional class name */
  className?: string;
}

/**
 * LunaRichTextEditor - Rich text editor for job descriptions, course content, etc.
 *
 * @example
 * ```tsx
 * <LunaRichTextEditor
 *   value={description}
 *   onChange={setDescription}
 *   label="Job Description"
 *   placeholder="Enter job description..."
 * />
 * ```
 */
export function LunaRichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  disabled = false,
  error = false,
  label,
  helperText,
  minHeight = 200,
  className,
}: LunaRichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded-md transition-all duration-150',
        'hover:bg-luna-gray-200 active:scale-95',
        active && 'bg-luna-blue text-white hover:bg-luna-blue/90',
        !active && 'text-luna-gray-700',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent active:scale-100'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn('space-y-2', className)} data-slot="luna-rich-text-editor">
      {label && (
        <label className="block text-sm font-medium text-luna-gray-900">{label}</label>
      )}

      <div
        className={cn(
          'border rounded-lg overflow-hidden bg-white transition-colors',
          error ? 'border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20' : 'border-luna-gray-300 focus-within:border-luna-blue focus-within:ring-2 focus-within:ring-luna-blue/20',
          disabled && 'opacity-50 cursor-not-allowed bg-luna-gray-50'
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap gap-0.5 p-2 border-b border-luna-gray-200 bg-luna-gray-50/50">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            disabled={disabled}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            disabled={disabled}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            disabled={disabled}
            title="Heading"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-luna-gray-300 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            disabled={disabled}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            disabled={disabled}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            disabled={disabled}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-luna-gray-300 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className="tiptap-editor-content"
          style={{ minHeight }}
        />
      </div>

      {helperText && (
        <p className={cn('text-sm', error ? 'text-red-500' : 'text-luna-gray-600')}>
          {helperText}
        </p>
      )}

      {/* Custom Styles for TipTap Content */}
      <style jsx global>{`
        .tiptap-editor-content {
          padding: 1rem;
        }

        .tiptap-editor-content .ProseMirror {
          outline: none;
          min-height: inherit;
        }

        .tiptap-editor-content .ProseMirror p {
          margin: 0.75em 0;
        }

        .tiptap-editor-content .ProseMirror p:first-child {
          margin-top: 0;
        }

        .tiptap-editor-content .ProseMirror p:last-child {
          margin-bottom: 0;
        }

        .tiptap-editor-content .ProseMirror strong {
          font-weight: 600;
          color: #1a1a1a;
        }

        .tiptap-editor-content .ProseMirror em {
          font-style: italic;
        }

        .tiptap-editor-content .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 1em 0 0.5em;
          line-height: 1.3;
          color: #1a1a1a;
        }

        .tiptap-editor-content .ProseMirror h2:first-child {
          margin-top: 0;
        }

        .tiptap-editor-content .ProseMirror ul,
        .tiptap-editor-content .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.75em 0;
        }

        .tiptap-editor-content .ProseMirror ul {
          list-style-type: disc;
        }

        .tiptap-editor-content .ProseMirror ol {
          list-style-type: decimal;
        }

        .tiptap-editor-content .ProseMirror li {
          margin: 0.25em 0;
        }

        .tiptap-editor-content .ProseMirror li p {
          margin: 0;
        }

        .tiptap-editor-content .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1em 0;
          color: #6b7280;
          font-style: italic;
        }

        .tiptap-editor-content .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Courier New', monospace;
        }

        .tiptap-editor-content .ProseMirror pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 1em 0;
        }

        .tiptap-editor-content .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }

        /* Placeholder styling */
        .tiptap-editor-content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }

        /* Selection styling */
        .tiptap-editor-content .ProseMirror ::selection {
          background-color: #dbeafe;
        }
      `}</style>
    </div>
  );
}

