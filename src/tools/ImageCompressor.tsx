import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Minimize2 } from 'lucide-react';
import { ToolHeader } from '../components/common/ToolHeader';
import { FileDropzone } from '../components/common/FileDropzone';
import { ProgressBar } from '../components/common/ProgressBar';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { FilePreviewCard } from '../components/common/FilePreviewCard';
import { ResultPanel } from '../components/common/ResultPanel';
import { UploadedFile, CompressionLevel } from '../types';
import {
  generateId,
  formatFileSize,
  getImageDimensions,
  triggerDownload,
  cleanUpFile,
  decodeImage,
  normalizeImageMimeType,
  validateSelectedFile,
  describeProcessingError,
  MAX_IMAGE_BYTES,
} from '../utils/fileHelpers';

interface ImageCompressorProps {
  onBack: () => void;
}

const COMPRESSION_LEVELS: CompressionLevel[] = [
  {
    label: 'Low Compression',
    value: 'low',
    quality: 0.88,
    description: 'High visual quality with gentle file reduction (~20-40% smaller).',
  },
  {
    label: 'Medium Compression',
    value: 'medium',
    quality: 0.68,
    description: 'Optimal balance between noticeable size savings and clarity (~50-70% smaller).',
  },
  {
    label: 'High Compression',
    value: 'high',
    quality: 0.45,
    description: 'Maximum shrinking for faster web uploads and emails (~70-90% smaller).',
  },
];

export const ImageCompressor: React.FC<ImageCompressorProps> = ({ onBack }) => {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const liveFile = useRef<UploadedFile | null>(null);

  // Track the latest file so cleanup runs once on unmount (never mid-session)
  useEffect(() => {
    liveFile.current = file;
  }, [file]);

  useEffect(() => {
    return () => {
      const current = liveFile.current;
      if (current) cleanUpFile(current.previewUrl, current.outputUrl);
    };
  }, []);

  // Auto-scroll to the result once processing finishes
  useEffect(() => {
    if (file?.status === 'success') {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [file?.status]);

  const isProcessing = file?.status === 'processing';
  const resultReady = file?.status === 'success';
  const savedPercent =
    file && file.outputSize && file.size > file.outputSize
      ? Math.round(((file.size - file.outputSize) / file.size) * 100)
      : 0;

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setError(null);
    setDownloaded(false);

    if (selectedFiles.length === 0 || isProcessing) return;
    const selectedFile = selectedFiles[0];

    const validationError = validateSelectedFile(selectedFile, 'image');
    if (validationError) {
      setError(validationError);
      return;
    }

    if (file) {
      cleanUpFile(file.previewUrl, file.outputUrl);
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    let dims: { width: number; height: number } | undefined;
    try {
      dims = await getImageDimensions(selectedFile);
    } catch {
      // Dimensions optional
    }

    const normalizedType = normalizeImageMimeType(selectedFile.type, selectedFile.name);

    const newFile: UploadedFile = {
      id: generateId(),
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      type: normalizedType || selectedFile.type,
      previewUrl,
      dimensions: dims,
      status: 'idle',
    };

    setFile(newFile);
    compressImage(newFile, selectedLevel);
  };

  const compressImage = async (targetFile: UploadedFile, levelVal: 'low' | 'medium' | 'high') => {
    const level = COMPRESSION_LEVELS.find((l) => l.value === levelVal) || COMPRESSION_LEVELS[1];
    setFile((prev) => prev ? { ...prev, status: 'processing', outputBlob: undefined, outputUrl: undefined } : null);
    setProgress(15);

    try {
      const decoded = await decodeImage(targetFile.file);
      setProgress(40);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = decoded.width;
      canvas.height = decoded.height;

      if (ctx) {
        // High quality filtering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // For JPEG, fill white background to avoid black transparency replacement
        if (targetFile.type === 'image/jpeg' || targetFile.name.toLowerCase().endsWith('.jpg') || targetFile.name.toLowerCase().endsWith('.jpeg')) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
      }

      decoded.close();
      setProgress(60);

      // Determine output mime type
      let outputMime = targetFile.type || 'image/jpeg';
      if (outputMime === 'image/png' && (levelVal === 'medium' || levelVal === 'high')) {
        outputMime = 'image/webp';
      }

      canvas.toBlob(
        (blob) => {
          setProgress(100);
          if (!blob) {
            setError('Compression failed. Please try a different image.');
            setFile((prev) => prev ? { ...prev, status: 'error' } : null);
            return;
          }

          const outputUrl = URL.createObjectURL(blob);
          setFile((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'success',
                  outputBlob: blob,
                  outputUrl: outputUrl,
                  outputSize: blob.size,
                }
              : null
          );
        },
        outputMime,
        level.quality
      );
    } catch (err) {
      console.error('Image compression error:', err);
      setError(describeProcessingError(err, 'image'));
      setFile((prev) => (prev ? { ...prev, status: 'error' } : null));
    }
  };

  const handleLevelChange = (levelVal: 'low' | 'medium' | 'high') => {
    if (isProcessing || levelVal === selectedLevel) return;
    setSelectedLevel(levelVal);
    setDownloaded(false);
    if (file) {
      if (file.outputUrl) cleanUpFile(undefined, file.outputUrl);
      compressImage(file, levelVal);
    }
  };

  const outputFileName = useMemo(() => {
    if (!file) return '';
    let extension = file.name.slice((Math.max(0, file.name.lastIndexOf('.')) || Infinity) + 1);
    if (file.outputBlob?.type === 'image/webp' && !file.name.toLowerCase().endsWith('.webp')) {
      extension = 'webp';
    }
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return `${baseName}-compressed.${extension || 'jpg'}`;
  }, [file]);

  const handleDownload = useCallback(() => {
    // Guard against duplicate clicks / stale state
    if (!file?.outputUrl || !file.outputBlob || downloaded) return;

    triggerDownload(file.outputUrl, outputFileName);
    setDownloaded(true);

    // Release temporary data once the download has been handed to the browser
    const url = file.outputUrl;
    window.setTimeout(() => {
      cleanUpFile(undefined, url);
      setFile((prev) => (prev ? { ...prev, outputUrl: undefined, outputBlob: undefined } : null));
    }, 1500);
  }, [file, downloaded, outputFileName]);

  const handleRemoveFile = useCallback(() => {
    setFile((prev) => {
      if (prev) cleanUpFile(prev.previewUrl, prev.outputUrl);
      return null;
    });
    setError(null);
    setDownloaded(false);
    setProgress(0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-fade-in pb-16">
      <ToolHeader
        title="Image Compressor"
        description="Compress JPG, PNG, and WebP images directly in your browser with smart compression options. Maintain clarity while sharply reducing file size."
        icon={<Minimize2 className="w-8 h-8" />}
        onBack={onBack}
        categoryTag="JPG / PNG / WebP"
      />

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          label="Drag & Drop your image to compress"
          sublabel="Supports JPG, PNG, and WebP formats. Processed completely in browser."
          hint={`Single image • up to ${formatFileSize(MAX_IMAGE_BYTES)}`}
          disabled={isProcessing}
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* File item preview */}
          <FilePreviewCard
            fileItem={file}
            onRemove={handleRemoveFile}
            extraInfo={
              file.status === 'success' && file.outputSize !== undefined ? (
                <span className="flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Compressed Size: {formatFileSize(file.outputSize)}</span>
                  {savedPercent > 0 && (
                    <span className="bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                      −{savedPercent}% Saved!
                    </span>
                  )}
                </span>
              ) : undefined
            }
          />

          {/* Compression Level Selection */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Select Compression Level
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Choose how much compression to apply while preserving image visual fidelity.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {COMPRESSION_LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => handleLevelChange(lvl.value)}
                    disabled={isProcessing}
                    aria-pressed={isSelected}
                    className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm dark:border-blue-500'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                    }`}
                  >
                    <span className="flex items-center justify-between w-full mb-1.5">
                      <span className={`font-bold text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                        {lvl.label}
                      </span>
                      {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {lvl.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Processing and Progress Bar */}
          {isProcessing && (
            <ProgressBar progress={progress} statusText="Compressing and optimizing image..." />
          )}

          {/* Compression Results & Actions */}
          <div ref={resultRef} data-scroll-target>
            {resultReady && (
              <ResultPanel
                accent="blue"
                originalSize={file.size}
                processedSize={file.outputSize ?? 0}
                outputName={outputFileName}
                meta={`${selectedLevel.charAt(0).toUpperCase()}${selectedLevel.slice(1)} compression`}
                downloaded={downloaded}
                downloadLabel="Download compressed image"
                onDownload={handleDownload}
                onReset={handleRemoveFile}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
