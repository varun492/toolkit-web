import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileUp, Trash2, Plus, ShieldCheck, Layers, Loader2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
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
  triggerDownload,
  cleanUpFile,
  decodeImage,
  validateImageMimeType,
  normalizeImageMimeType,
  validateSelectedFile,
  describeProcessingError,
  MAX_IMAGE_BYTES,
} from '../utils/fileHelpers';

interface ImageToPDFProps {
  onBack: () => void;
}

export const ImageToPDF: React.FC<ImageToPDFProps> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pageSize, setPageSize] = useState<'fit' | 'a4'>('fit');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [outputPdfUrl, setOutputPdfUrl] = useState<string | null>(null);
  const [outputPdfSize, setOutputPdfSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  
  // Track drag state for reordering
  const dragItemIndex = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const liveState = useRef<{ files: UploadedFile[]; url: string | null }>({ files: [], url: null });

  useEffect(() => {
    liveState.current = { files, url: outputPdfUrl };
  }, [files, outputPdfUrl]);

  // Revoke object URLs only when the tool unmounts
  useEffect(() => {
    return () => {
      liveState.current.files.forEach((f) => cleanUpFile(f.previewUrl));
      if (liveState.current.url) cleanUpFile(undefined, liveState.current.url);
    };
  }, []);

  useEffect(() => {
    if (outputPdfUrl) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [outputPdfUrl]);

  const totalInputSize = files.reduce((sum, f) => sum + f.size, 0);

  const handleFilesSelected = (newFiles: File[]) => {
    setError(null);
    setDownloaded(false);
    if (isGenerating) return;

    if (outputPdfUrl) {
      cleanUpFile(undefined, outputPdfUrl);
      setOutputPdfUrl(null);
    }

    const validFiles: UploadedFile[] = [];
    const rejected: string[] = [];

    for (const f of newFiles) {
      const problem = validateSelectedFile(f, 'image');
      if (problem) {
        rejected.push(problem);
        continue;
      }
      if (validateImageMimeType(f.type, f.name)) {
        const normalizedType = normalizeImageMimeType(f.type, f.name);
        validFiles.push({
          id: generateId(),
          file: f,
          name: f.name,
          size: f.size,
          type: normalizedType || f.type,
          previewUrl: URL.createObjectURL(f),
          status: 'idle',
        });
      }
    }

    if (validFiles.length === 0) {
      setError(rejected[0] ?? 'Please select valid image files (JPG, PNG, or WebP).');
      return;
    }

    if (rejected.length > 0) {
      setError(`${rejected.length} file(s) were skipped. ${rejected[0]}`);
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (id: string) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove) {
      cleanUpFile(fileToRemove.previewUrl);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (outputPdfUrl) {
      cleanUpFile(undefined, outputPdfUrl);
      setOutputPdfUrl(null);
    }
  };

  const handleClearAll = () => {
    files.forEach((f) => cleanUpFile(f.previewUrl));
    if (outputPdfUrl) cleanUpFile(undefined, outputPdfUrl);
    setFiles([]);
    setOutputPdfUrl(null);
    setOutputPdfSize(null);
    setError(null);
    setDownloaded(false);
    setProgress(0);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...files];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    setFiles(newArr);
    if (outputPdfUrl) setOutputPdfUrl(null);
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newArr = [...files];
    [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    setFiles(newArr);
    if (outputPdfUrl) setOutputPdfUrl(null);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };

  const handleDrop = (dropIndex: number) => {
    if (dragItemIndex.current === null || dragItemIndex.current === dropIndex) return;
    const newArr = [...files];
    const [draggedItem] = newArr.splice(dragItemIndex.current, 1);
    newArr.splice(dropIndex, 0, draggedItem);
    dragItemIndex.current = null;
    setFiles(newArr);
    if (outputPdfUrl) setOutputPdfUrl(null);
  };

  // Convert non-standard image (like WebP) to PNG ArrayBuffer via canvas using reliable decoding
  const convertImageToPngBuffer = async (fileItem: UploadedFile): Promise<ArrayBuffer> => {
    const decoded = await decodeImage(fileItem.file);
    const canvas = document.createElement('canvas');
    canvas.width = decoded.width;
    canvas.height = decoded.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(decoded.source, 0, 0);
    }
    decoded.close();

    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const buffer = await blob.arrayBuffer();
          resolve(buffer);
        } else {
          reject(new Error('Failed to convert image format'));
        }
      }, 'image/png');
    });
  };

  const generatePDF = async () => {
    if (files.length === 0) return;
    setIsGenerating(true);
    setError(null);
    setDownloaded(false);
    setProgress(10);

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        setProgress(Math.round(10 + (i / files.length) * 75));

        let imgObj;
        const lowerName = fileItem.name.toLowerCase();
        
        try {
          const buffer = await fileItem.file.arrayBuffer();
          if (fileItem.type === 'image/png' || lowerName.endsWith('.png')) {
            imgObj = await pdfDoc.embedPng(buffer);
          } else if (fileItem.type === 'image/jpeg' || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
            imgObj = await pdfDoc.embedJpg(buffer);
          } else {
            // Convert WebP or other format to PNG buffer before embedding
            const pngBuffer = await convertImageToPngBuffer(fileItem);
            imgObj = await pdfDoc.embedPng(pngBuffer);
          }
        } catch {
          // Fallback via Canvas PNG rendering if direct embed fails
          const fallbackBuffer = await convertImageToPngBuffer(fileItem);
          imgObj = await pdfDoc.embedPng(fallbackBuffer);
        }

        const { width, height } = imgObj.scale(1);

        if (pageSize === 'a4') {
          // Standard A4 dimensions in points (595.28 x 841.89)
          const a4W = 595.28;
          const a4H = 841.89;
          const margin = 36; // 0.5 inch margin
          const maxW = a4W - margin * 2;
          const maxH = a4H - margin * 2;
          
          const scale = Math.min(maxW / width, maxH / height, 1);
          const drawW = width * scale;
          const drawH = height * scale;

          const page = pdfDoc.addPage([a4W, a4H]);
          page.drawImage(imgObj, {
            x: (a4W - drawW) / 2,
            y: (a4H - drawH) / 2,
            width: drawW,
            height: drawH,
          });
        } else {
          // Fit page to exact image dimensions
          const page = pdfDoc.addPage([width, height]);
          page.drawImage(imgObj, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          });
        }
      }

      setProgress(90);
      const pdfBytes = await pdfDoc.save();
      const outputBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(outputBlob);

      setOutputPdfUrl(url);
      setOutputPdfSize(outputBlob.size);
      setProgress(100);
      setIsGenerating(false);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setError(describeProcessingError(err, 'pdf'));
      setIsGenerating(false);
    }
  };

  const outputFileName =
    files.length === 1 && files[0]
      ? `${files[0].name.substring(0, files[0].name.lastIndexOf('.')) || files[0].name}.pdf`
      : 'converted-images.pdf';

  const handleDownload = useCallback(() => {
    if (!outputPdfUrl || downloaded) return;

    triggerDownload(outputPdfUrl, outputFileName);
    setDownloaded(true);

    const url = outputPdfUrl;
    window.setTimeout(() => {
      cleanUpFile(undefined, url);
      setOutputPdfUrl(null);
    }, 1500);
  }, [outputPdfUrl, downloaded, outputFileName]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-fade-in pb-16">
      <ToolHeader
        title="Image to PDF"
        description="Convert single or multiple JPG, PNG, and WebP images into a cohesive PDF document. Reorder pages with easy drag & drop controls."
        icon={<FileUp className="w-8 h-8" />}
        onBack={onBack}
        categoryTag="Images → PDF"
      />

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {files.length === 0 ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple={true}
          label="Drag & Drop images here"
          sublabel="Upload single or multiple JPG, PNG, and WebP images to generate your custom PDF."
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Uploaded Images ({files.length})</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Drag using the handle or use arrow buttons to arrange PDF page order.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold text-xs border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add More Images</span>
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs transition-colors flex items-center gap-1.5 justify-center"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Page Sizing Option */}
          <div className="bg-gray-50/70 dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
              PDF Page Size Format:
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => { setPageSize('fit'); setOutputPdfUrl(null); }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pageSize === 'fit'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Fit Exactly to Image Resolution
              </button>
              <button
                type="button"
                onClick={() => { setPageSize('a4'); setOutputPdfUrl(null); }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pageSize === 'a4'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Standard A4 Document (Centered)
              </button>
            </div>
          </div>

          {/* Reorderable File List */}
          <div className="space-y-3">
            {files.map((fileItem, index) => (
              <FilePreviewCard
                key={fileItem.id}
                fileItem={fileItem}
                index={index}
                totalCount={files.length}
                onRemove={handleRemoveFile}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                showOrderControls={true}
              />
            ))}
          </div>

          {/* Processing and Progress Bar */}
          {isGenerating && (
            <ProgressBar progress={progress} statusText={`Assembling PDF with ${files.length} ${files.length === 1 ? 'page' : 'pages'}...`} />
          )}

          {/* Action to Generate or Download */}
          <div ref={resultRef} data-scroll-target>
            {!outputPdfUrl ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                  <span>Images are compiled locally in memory and never transmitted online</span>
                </p>

                <button
                  type="button"
                  onClick={generatePDF}
                  disabled={isGenerating || files.length === 0}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-500/25 hover:shadow-purple-500/35 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none motion-reduce:active:scale-100"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      <span>Generating PDF…</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                      <span>
                        Generate PDF ({files.length} {files.length === 1 ? 'Page' : 'Pages'})
                      </span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <ResultPanel
                accent="purple"
                originalSize={totalInputSize}
                processedSize={outputPdfSize ?? 0}
                outputName={outputFileName}
                meta={`${files.length} ${files.length === 1 ? 'page' : 'pages'} • ${pageSize === 'a4' ? 'A4' : 'Fit to image'}`}
                downloaded={downloaded}
                downloadLabel="Download PDF"
                onDownload={handleDownload}
                onReset={handleClearAll}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
