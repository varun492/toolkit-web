import React, { useState, useEffect, useRef } from 'react';
import { Layers, Download, Trash2, Plus, CheckCircle, ShieldCheck, FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { ToolHeader } from '../components/common/ToolHeader';
import { FileDropzone } from '../components/common/FileDropzone';
import { ProgressBar } from '../components/common/ProgressBar';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { FilePreviewCard } from '../components/common/FilePreviewCard';
import { UploadedFile } from '../types';
import { generateId, formatFileSize, triggerDownload, cleanUpFile } from '../utils/fileHelpers';

interface PDFMergeProps {
  onBack: () => void;
}

export const PDFMerge: React.FC<PDFMergeProps> = ({ onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [mergedPdfSize, setMergedPdfSize] = useState<number | null>(null);
  const [totalMergedPages, setTotalMergedPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  const dragItemIndex = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (mergedPdfUrl) cleanUpFile(undefined, mergedPdfUrl);
    };
  }, [mergedPdfUrl]);

  const handleFilesSelected = async (newFiles: File[]) => {
    setError(null);
    setDownloaded(false);
    if (mergedPdfUrl) {
      cleanUpFile(undefined, mergedPdfUrl);
      setMergedPdfUrl(null);
    }

    const validFiles: UploadedFile[] = [];
    for (const f of newFiles) {
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        let pagesCount: number | undefined;
        try {
          const arrayBuf = await f.arrayBuffer();
          const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: false });
          pagesCount = doc.getPageCount();
        } catch (err) {
          console.warn('Could not read PDF page count or password protected:', err);
        }

        validFiles.push({
          id: generateId(),
          file: f,
          name: f.name,
          size: f.size,
          type: 'application/pdf',
          pageCount: pagesCount,
          status: 'idle',
        });
      }
    }

    if (validFiles.length === 0) {
      setError('Please select valid PDF (.pdf) documents.');
      return;
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (mergedPdfUrl) {
      cleanUpFile(undefined, mergedPdfUrl);
      setMergedPdfUrl(null);
    }
  };

  const handleClearAll = () => {
    if (mergedPdfUrl) cleanUpFile(undefined, mergedPdfUrl);
    setFiles([]);
    setMergedPdfUrl(null);
    setMergedPdfSize(null);
    setError(null);
    setDownloaded(false);
    setProgress(0);
    setTotalMergedPages(0);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...files];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    setFiles(newArr);
    if (mergedPdfUrl) setMergedPdfUrl(null);
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newArr = [...files];
    [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    setFiles(newArr);
    if (mergedPdfUrl) setMergedPdfUrl(null);
  };

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
    if (mergedPdfUrl) setMergedPdfUrl(null);
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge them together.');
      return;
    }

    setIsMerging(true);
    setError(null);
    setDownloaded(false);
    setProgress(15);

    try {
      const mergedDoc = await PDFDocument.create();
      let totalPages = 0;

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        if (item) {
          setProgress(Math.round(15 + (i / files.length) * 70));

          const buffer = await item.file.arrayBuffer();
          const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
          
          for (const page of copiedPages) {
            mergedDoc.addPage(page);
            totalPages++;
          }
        }
      }

      setProgress(90);
      const pdfBytes = await mergedDoc.save();
      const outputBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(outputBlob);

      setMergedPdfUrl(url);
      setMergedPdfSize(outputBlob.size);
      setTotalMergedPages(totalPages);
      setProgress(100);
      setIsMerging(false);
    } catch (err) {
      console.error('PDF Merge Error:', err);
      setError('Failed to merge documents. Ensure none of the files are password-protected or corrupted.');
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedPdfUrl) return;
    const finalName = 'merged-documents.pdf';
    
    triggerDownload(mergedPdfUrl, finalName);
    setDownloaded(true);

    setTimeout(() => {
      handleClearAll();
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-fade-in pb-16">
      <ToolHeader
        title="PDF Merge"
        description="Upload multiple PDF files, arrange their order by dragging or clicking arrows, and combine them into a single clean PDF document."
        icon={<Layers className="w-8 h-8" />}
        onBack={onBack}
        categoryTag="Combine PDFs"
      />

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {files.length === 0 ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept="application/pdf,.pdf"
          multiple={true}
          label="Drag & Drop PDF files here"
          sublabel="Upload 2 or more PDF files to merge into one document. All processing runs privately in browser."
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Top Control Bar */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>Uploaded PDFs ({files.length})</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Drag to reorder documents in the sequence they should appear in the merged file.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-200 dark:border-amber-800/80 transition-colors flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add More PDFs</span>
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

          {/* Document list */}
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
          {isMerging && (
            <ProgressBar progress={progress} statusText={`Merging ${files.length} PDF documents into one...`} />
          )}

          {/* Actions & Download */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 shadow-xs">
            {!mergedPdfUrl ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>PDFs are combined locally in memory and never transmitted online</span>
                </div>

                <button
                  type="button"
                  onClick={mergePDFs}
                  disabled={isMerging || files.length < 2}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-500/25 hover:shadow-amber-500/35 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  <Layers className="w-5 h-5" />
                  <span>Merge {files.length} {files.length === 1 ? 'File' : 'Files'} into One PDF</span>
                </button>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      ✓ PDF Successfully Merged
                    </span>
                    <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                      merged-documents.pdf <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({formatFileSize(mergedPdfSize || 0)})</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                    Total: {totalMergedPages} {totalMergedPages === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>

                {downloaded ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2 font-semibold text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Downloaded successfully! Temporary processing data deleted from memory.</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Temporary data deleted immediately after download</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Discard</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownload}
                        className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-500/25 hover:shadow-amber-500/35 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <Download className="w-5 h-5" />
                        <span>One-Click Download Merged PDF</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
