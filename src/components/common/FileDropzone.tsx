import React, { useState, useRef, useCallback, useId } from 'react';
import { Upload, FileUp, ShieldAlert } from 'lucide-react';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  label?: string;
  sublabel?: string;
  hint?: string;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  accept,
  multiple = false,
  label = 'Drag & Drop files here',
  sublabel = 'or click the button below to browse from your device',
  hint,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const dropped = Array.from(e.dataTransfer.files ?? []);
      if (dropped.length === 0) return;
      onFilesSelected(multiple ? dropped : [dropped[0]]);
    },
    [disabled, multiple, onFilesSelected]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []);
      if (picked.length > 0) onFilesSelected(picked);
      // Reset so re-picking the same file still fires a change event
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [onFilesSelected]
  );

  const openPicker = useCallback(() => fileInputRef.current?.click(), []);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-disabled={disabled || undefined}
      className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 ${
        disabled
          ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900/40 border-gray-300 dark:border-gray-700'
          : isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01] shadow-lg'
            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 bg-gray-50/50 dark:bg-gray-900/40'
      } motion-reduce:transition-none motion-reduce:scale-100`}
    >
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
        className="sr-only"
      />

      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
        <div
          className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center transition-transform duration-200 motion-reduce:transition-none ${
            isDragging
              ? 'bg-blue-500 text-white scale-110'
              : 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
          }`}
        >
          {isDragging ? (
            <FileUp className="w-8 h-8 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Upload className="w-8 h-8" aria-hidden="true" />
          )}
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
          {isDragging ? 'Drop file right here!' : label}
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{sublabel}</p>

        <label
          htmlFor={inputId}
          onClick={(e) => {
            e.preventDefault();
            if (!disabled) openPicker();
          }}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              openPicker();
            }
          }}
          tabIndex={disabled ? -1 : 0}
          role="button"
          className={`px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 ${
            disabled
              ? 'pointer-events-none opacity-60'
              : 'hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-95 cursor-pointer motion-reduce:active:scale-100'
          }`}
        >
          Browse {multiple ? 'Files' : 'File'}
        </label>

        {hint && (
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 font-medium">{hint}</p>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
          <span>Files stay on your device and are cleared as soon as you are done</span>
        </p>
      </div>
    </div>
  );
};
