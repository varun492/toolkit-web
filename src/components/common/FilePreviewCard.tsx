import React, { useState } from 'react';
import { FileText, Trash2, ArrowUp, ArrowDown, GripVertical, Check, RefreshCw } from 'lucide-react';
import { UploadedFile } from '../../types';
import { formatFileSize } from '../../utils/fileHelpers';

interface FilePreviewCardProps {
  fileItem: UploadedFile;
  index?: number;
  totalCount?: number;
  onRemove: (id: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number, e: React.DragEvent) => void;
  onDrop?: (index: number) => void;
  showOrderControls?: boolean;
  extraInfo?: React.ReactNode;
}

export const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
  fileItem,
  index = 0,
  totalCount = 1,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  showOrderControls = false,
  extraInfo,
}) => {
  const [isDragTarget, setIsDragTarget] = useState(false);
  const isImage = fileItem.type.startsWith('image/') || fileItem.previewUrl;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragTarget(true);
    if (onDragOver) onDragOver(index, e);
  };

  const handleDragLeave = () => {
    setIsDragTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragTarget(false);
    if (onDrop) onDrop(index);
  };

  return (
    <div
      draggable={showOrderControls && !!onDragStart}
      onDragStart={() => onDragStart && onDragStart(index)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex items-center gap-3 sm:gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border transition-all duration-150 ${
        isDragTarget
          ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 scale-[1.01]'
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-xs'
      }`}
    >
      {/* Drag handle if ordering is enabled */}
      {showOrderControls && (
        <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing flex items-center justify-center p-1">
          <GripVertical className="w-5 h-5" />
        </div>
      )}

      {/* Index Badge */}
      {showOrderControls && (
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">
          #{index + 1}
        </div>
      )}

      {/* Thumbnail or File Icon */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-center flex-shrink-0 relative group">
        {isImage && fileItem.previewUrl ? (
          <img
            src={fileItem.previewUrl}
            alt={fileItem.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-red-600 dark:text-red-400">
            <FileText className="w-7 h-7 mb-0.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">PDF</span>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate mb-1" title={fileItem.name}>
          {fileItem.name}
        </h4>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <span className="font-medium">{formatFileSize(fileItem.size)}</span>
          
          {fileItem.dimensions && (
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
              {fileItem.dimensions.width} × {fileItem.dimensions.height}px
            </span>
          )}

          {fileItem.pageCount !== undefined && fileItem.pageCount > 0 && (
            <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-medium border border-blue-200/60 dark:border-blue-800/60">
              {fileItem.pageCount} {fileItem.pageCount === 1 ? 'page' : 'pages'}
            </span>
          )}

          {fileItem.status === 'processing' && (
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Processing...
            </span>
          )}

          {fileItem.status === 'success' && !extraInfo && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="w-3 h-3" />
              Ready
            </span>
          )}
        </div>

        {extraInfo && <div className="mt-2 text-xs">{extraInfo}</div>}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {showOrderControls && (
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/80 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => onMoveUp && onMoveUp(index)}
              disabled={index === 0}
              className="p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Move Up"
              aria-label="Move item up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onMoveDown && onMoveDown(index)}
              disabled={index === totalCount - 1}
              className="p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Move Down"
              aria-label="Move item down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => onRemove(fileItem.id)}
          className="p-2 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Remove File"
          aria-label={`Remove ${fileItem.name}`}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
