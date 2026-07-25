import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Maximize2, Lock, Unlock, RefreshCw } from 'lucide-react';
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

interface ImageResizerProps {
  onBack: () => void;
}

export const ImageResizer: React.FC<ImageResizerProps> = ({ onBack }) => {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);

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

  const resultReady = file?.status === 'success' && !isResizing;
  const dimensionsValid = width > 0 && height > 0 && width <= 10000 && height <= 10000;

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setError(null);
    setDownloaded(false);
    if (selectedFiles.length === 0 || isResizing) return;
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
    try {
      const dims = await getImageDimensions(selectedFile);
      setWidth(dims.width);
      setHeight(dims.height);
      setAspectRatio(dims.width / (dims.height || 1));

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
      // Generate initial scaled preview output
      applyResize(newFile, dims.width, dims.height);
    } catch {
      setError('Could not detect image dimensions. The image file may be invalid or damaged.');
    }
  };

  const handleWidthChange = (val: string) => {
    const num = parseInt(val, 10) || 0;
    setWidth(num);
    if (keepAspectRatio && num > 0) {
      const computedHeight = Math.round(num / aspectRatio);
      setHeight(computedHeight);
    }
  };

  const handleHeightChange = (val: string) => {
    const num = parseInt(val, 10) || 0;
    setHeight(num);
    if (keepAspectRatio && num > 0) {
      const computedWidth = Math.round(num * aspectRatio);
      setWidth(computedWidth);
    }
  };

  const handlePresetScale = (percent: number) => {
    if (!file?.dimensions) return;
    const newW = Math.round(file.dimensions.width * (percent / 100));
    const newH = Math.round(file.dimensions.height * (percent / 100));
    setWidth(newW);
    setHeight(newH);
    applyResize(file, newW, newH);
  };

  const applyResize = async (targetFile: UploadedFile, targetW: number, targetH: number) => {
    if (targetW <= 0 || targetH <= 0) {
      setError('Width and Height must be greater than 0 pixels.');
      return;
    }

    if (targetW > 10000 || targetH > 10000) {
      setError('Maximum supported resize dimension is 10,000 pixels to prevent high browser memory consumption.');
      return;
    }

    setError(null);
    setIsResizing(true);
    setFile((prev) => prev ? { ...prev, status: 'processing', outputBlob: undefined, outputUrl: undefined } : null);
    setProgress(20);

    try {
      const decoded = await decodeImage(targetFile.file);
      setProgress(50);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = targetW;
      canvas.height = targetH;

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (targetFile.type === 'image/jpeg' || targetFile.name.toLowerCase().endsWith('.jpg') || targetFile.name.toLowerCase().endsWith('.jpeg')) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(decoded.source, 0, 0, targetW, targetH);
      }

      decoded.close();
      setProgress(70);

      canvas.toBlob(
        (blob) => {
          setProgress(100);
          setIsResizing(false);
          if (!blob) {
            setError('Image scaling failed.');
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
        targetFile.type || 'image/png',
        0.95
      );
    } catch (err) {
      console.error('Image resize error:', err);
      setError(describeProcessingError(err, 'image'));
      setIsResizing(false);
      setFile((prev) => (prev ? { ...prev, status: 'error' } : null));
    }
  };

  const handleApplyClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isResizing || !dimensionsValid) return;
    setDownloaded(false);
    if (file.outputUrl) cleanUpFile(undefined, file.outputUrl);
    applyResize(file, width, height);
  };

  const outputFileName = useMemo(() => {
    if (!file) return '';
    const extension = file.name.slice((Math.max(0, file.name.lastIndexOf('.')) || Infinity) + 1);
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return `${baseName}-${width}x${height}.${extension || 'png'}`;
  }, [file, width, height]);

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
    setIsResizing(false);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-fade-in pb-16">
      <ToolHeader
        title="Image Resizer"
        description="Resize image width and height precisely in pixels with high-quality interpolation. Option to keep aspect ratio lock to prevent stretching."
        icon={<Maximize2 className="w-8 h-8" />}
        onBack={onBack}
        categoryTag="Resize Dimensions"
      />

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          label="Drag & Drop image to resize"
          sublabel="Supports JPG, PNG, and WebP formats. Instant in-browser dimensions scaling."
          hint={`Single image • up to ${formatFileSize(MAX_IMAGE_BYTES)}`}
          disabled={isResizing}
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          <FilePreviewCard
            fileItem={file}
            onRemove={handleRemoveFile}
            extraInfo={
              file.status === 'success' ? (
                <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Resized Dimensions: {width} × {height} px ({formatFileSize(file.outputSize)})</span>
                </div>
              ) : undefined
            }
          />

          {/* Resize Controls Form */}
          <form onSubmit={handleApplyClick} className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Dimension Controls
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Original Resolution: <strong className="text-gray-700 dark:text-gray-200">{file.dimensions?.width} × {file.dimensions?.height} px</strong>
                </p>
              </div>

              {/* Aspect Ratio Lock Toggle */}
              <button
                type="button"
                onClick={() => setKeepAspectRatio(!keepAspectRatio)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  keepAspectRatio
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700'
                }`}
              >
                {keepAspectRatio ? <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Unlock className="w-4 h-4 text-gray-400" />}
                <span>Keep Aspect Ratio: {keepAspectRatio ? 'Locked' : 'Unlocked'}</span>
              </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Width (px)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    min={1}
                    max={10000}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 font-mono text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs uppercase font-bold">
                    Pixels
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Height (px)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    min={1}
                    max={10000}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 font-mono text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs uppercase font-bold">
                    Pixels
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Scale Presets */}
            <div className="mb-8">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">Quick Scale Presets:</span>
              <div className="flex flex-wrap gap-2">
                {[25, 50, 75, 100, 150, 200].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => handlePresetScale(percent)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    {percent}% {percent === 100 ? '(Original)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isResizing || !dimensionsValid}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 active:scale-95 transition-all duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:active:scale-100"
              >
                <RefreshCw
                  className={`w-4 h-4 flex-shrink-0 ${isResizing ? 'animate-spin motion-reduce:animate-none' : ''}`}
                  aria-hidden="true"
                />
                <span>{isResizing ? 'Resizing…' : 'Apply New Dimensions'}</span>
              </button>
            </div>
          </form>

          {/* Progress Bar */}
          {isResizing && (
            <ProgressBar progress={progress} statusText={`Resizing image to ${width} × ${height} px...`} />
          )}

          {/* Results Card */}
          <div ref={resultRef} data-scroll-target>
            {resultReady && (
              <ResultPanel
                accent="indigo"
                originalSize={file.size}
                processedSize={file.outputSize ?? 0}
                outputName={outputFileName}
                meta={`${width} × ${height} px`}
                downloaded={downloaded}
                downloadLabel="Download resized image"
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
