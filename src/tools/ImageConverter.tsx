import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { ToolHeader } from '../components/common/ToolHeader';
import { FileDropzone } from '../components/common/FileDropzone';
import { ProgressBar } from '../components/common/ProgressBar';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { FilePreviewCard } from '../components/common/FilePreviewCard';
import { UploadedFile } from '../types';
import { ResultPanel } from '../components/common/ResultPanel';
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

interface ImageConverterProps {
  onBack: () => void;
}

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

const FORMAT_OPTIONS: { label: string; ext: string; value: OutputFormat; desc: string }[] = [
  {
    label: 'JPG (JPEG)',
    ext: 'jpg',
    value: 'image/jpeg',
    desc: 'Best for photographs and general web sharing with universal compatibility.',
  },
  {
    label: 'PNG (Lossless)',
    ext: 'png',
    value: 'image/png',
    desc: 'Best for graphics, screenshots, and preserving crisp transparency.',
  },
  {
    label: 'WebP (Modern)',
    ext: 'webp',
    value: 'image/webp',
    desc: 'Modern Google image format combining high quality with small file size.',
  },
];

export const ImageConverter: React.FC<ImageConverterProps> = ({ onBack }) => {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [targetFormat, setTargetFormat] = useState<OutputFormat>('image/png');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const liveFile = useRef<UploadedFile | null>(null);

  useEffect(() => {
    liveFile.current = file;
  }, [file]);

  useEffect(() => {
    return () => {
      const current = liveFile.current;
      if (current) cleanUpFile(current.previewUrl, current.outputUrl);
    };
  }, []);

  useEffect(() => {
    if (file?.status === 'success') {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [file?.status]);

  const isProcessing = file?.status === 'processing';
  const resultReady = file?.status === 'success';

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setError(null);
    setDownloaded(false);
    if (selectedFiles.length === 0 || isProcessing) return;
    const selectedFile = selectedFiles[0];

    // Validate type and size before decoding
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
    } catch {}

    const normalizedSourceType = normalizeImageMimeType(selectedFile.type, selectedFile.name);
    let initialTarget: OutputFormat = 'image/png';
    if (normalizedSourceType === 'image/png') {
      initialTarget = 'image/jpeg';
    } else if (normalizedSourceType === 'image/webp') {
      initialTarget = 'image/png';
    } else {
      initialTarget = 'image/png';
    }
    setTargetFormat(initialTarget);

    const newFile: UploadedFile = {
      id: generateId(),
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      type: normalizedSourceType || selectedFile.type,
      previewUrl,
      dimensions: dims,
      status: 'idle',
    };

    setFile(newFile);
    convertImage(newFile, initialTarget);
  };

  const convertImage = async (targetFile: UploadedFile, format: OutputFormat) => {
    setFile((prev) => prev ? { ...prev, status: 'processing', outputBlob: undefined, outputUrl: undefined } : null);
    setProgress(20);

    try {
      // Robust native image decoding with EXIF orientation preservation and fallback mechanisms
      const decoded = await decodeImage(targetFile.file);
      setProgress(50);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = decoded.width;
      canvas.height = decoded.height;

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // When converting to JPG, fill white background to handle transparency
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
      }

      decoded.close();
      setProgress(70);

      canvas.toBlob(
        (blob) => {
          setProgress(100);
          if (!blob) {
            setError('Image conversion failed during encoding. Please try another image.');
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
        format,
        0.95 // High quality preservation
      );
    } catch (err) {
      console.error('Image conversion error:', err);
      setError(describeProcessingError(err, 'image'));
      setFile((prev) => (prev ? { ...prev, status: 'error' } : null));
    }
  };

  const handleFormatChange = (newFormat: OutputFormat) => {
    if (isProcessing || newFormat === targetFormat) return;
    setTargetFormat(newFormat);
    setDownloaded(false);
    if (file) {
      if (file.outputUrl) cleanUpFile(undefined, file.outputUrl);
      convertImage(file, newFormat);
    }
  };

  const outputFileName = useMemo(() => {
    if (!file) return '';
    const formatInfo = FORMAT_OPTIONS.find((f) => f.value === targetFormat) || FORMAT_OPTIONS[0];
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return `${baseName}-converted.${formatInfo.ext}`;
  }, [file, targetFormat]);

  const handleDownload = useCallback(() => {
    if (!file?.outputUrl || !file.outputBlob || downloaded) return;

    triggerDownload(file.outputUrl, outputFileName);
    setDownloaded(true);

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

  const getSourceExtension = (type?: string, name?: string) => {
    if (name) {
      const ext = name.slice((Math.max(0, name.lastIndexOf('.')) || Infinity) + 1).toUpperCase();
      if (ext) return ext;
    }
    if (type === 'image/jpeg') return 'JPG';
    if (type === 'image/png') return 'PNG';
    if (type === 'image/webp') return 'WEBP';
    return 'IMG';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-fade-in pb-16">
      <ToolHeader
        title="Image Converter"
        description="Convert seamlessly between JPG, PNG, and WebP file formats. Runs 100% locally in your web browser with uncompromised image quality."
        icon={<RefreshCw className="w-8 h-8" />}
        onBack={onBack}
        categoryTag="JPG ↔ PNG ↔ WebP"
      />

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          label="Drag & Drop image to convert"
          sublabel="Upload a JPG, PNG, or WebP file to convert to another image format instantly."
          hint={`Single image • up to ${formatFileSize(MAX_IMAGE_BYTES)}`}
          disabled={isProcessing}
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          <FilePreviewCard
            fileItem={file}
            onRemove={handleRemoveFile}
            extraInfo={
              file.status === 'success' && file.outputSize !== undefined ? (
                <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Converted to {FORMAT_OPTIONS.find((f) => f.value === targetFormat)?.ext.toUpperCase()}: {formatFileSize(file.outputSize)}</span>
                </div>
              ) : undefined
            }
          />

          {/* Target Format Selection */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Select Output Format
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Choose which image format you wish to convert this file into.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FORMAT_OPTIONS.map((fmt) => {
                const isSelected = targetFormat === fmt.value;
                return (
                  <button
                    key={fmt.value}
                    type="button"
                    onClick={() => handleFormatChange(fmt.value)}
                    disabled={file.status === 'processing'}
                    className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-sm dark:border-emerald-500'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className={`font-bold text-sm ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`}>
                        {fmt.label}
                      </span>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {fmt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <ProgressBar
              progress={progress}
              statusText={`Converting to ${FORMAT_OPTIONS.find((f) => f.value === targetFormat)?.ext.toUpperCase()}...`}
            />
          )}

          {/* Results Card */}
          <div ref={resultRef} data-scroll-target>
            {resultReady && (
              <ResultPanel
                accent="emerald"
                originalSize={file.size}
                processedSize={file.outputSize ?? 0}
                outputName={outputFileName}
                meta={`${getSourceExtension(file.type, file.name)} → ${FORMAT_OPTIONS.find((f) => f.value === targetFormat)?.ext.toUpperCase()}`}
                downloaded={downloaded}
                downloadLabel="Download converted image"
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
