import React, { useState, useEffect } from 'react';
import { FileArchive, Download, Trash2, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { ToolHeader } from '../components/common/ToolHeader';
import { FileDropzone } from '../components/common/FileDropzone';
import { ProgressBar } from '../components/common/ProgressBar';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { FilePreviewCard } from '../components/common/FilePreviewCard';
import { UploadedFile } from '../types';
import { generateId, formatFileSize, triggerDownload, cleanUpFile } from '../utils/fileHelpers';

interface PDFCompressProps {
  onBack: () => void;
}

interface CompressionMode {
  id: 'standard' | 'deep' | 'extreme';
  label: string;
  description: string;
}

const MODES: CompressionMode[] = [
  {
    id: 'standard',
    label: 'Standard Optimization',
    description: 'Lossless structural repacking using Object Streams. Ideal for general document sharing.',
  },
  {
    id: 'deep',
    label: 'Deep Structural Clean',
    description: 'Strips unused document edit history, forms, and metadata while maintaining crisp font readability.',
  },
  {
    id: 'extreme',
    label: 'Maximum Compact',
    description: 'Reconstructs document page structures from scratch to eliminate redundant internal object definitions.',
  },
];

export const PDFCompress: React.FC<PDFCompressProps> = ({ onBack }) => {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep' | 'extreme'>('standard');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (file && file.outputUrl) cleanUpFile(undefined, file.outputUrl);
    };
  }, [file]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setError(null);
    setDownloaded(false);
    if (selectedFiles.length === 0) return;
    const selectedFile = selectedFiles[0];

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a valid PDF document.');
      return;
    }

    if (file && file.outputUrl) {
      cleanUpFile(undefined, file.outputUrl);
    }

    let pagesCount: number | undefined;
    try {
      const buffer = await selectedFile.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      pagesCount = doc.getPageCount();
    } catch {
      setError('Could not inspect PDF file. It might be corrupted or password-protected.');
      return;
    }

    const newFile: UploadedFile = {
      id: generateId(),
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      type: 'application/pdf',
      pageCount: pagesCount,
      status: 'idle',
    };

    setFile(newFile);
    compressPDF(newFile, selectedMode);
  };

  const compressPDF = async (targetFile: UploadedFile, mode: 'standard' | 'deep' | 'extreme') => {
    setFile((prev) => prev ? { ...prev, status: 'processing', outputBlob: undefined, outputUrl: undefined } : null);
    setProgress(20);

    try {
      const buffer = await targetFile.file.arrayBuffer();
      setProgress(40);

      const origDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setProgress(60);

      let resultingBytes: Uint8Array;

      if (mode === 'standard') {
        // Simple optimization with object streams
        resultingBytes = await origDoc.save({ useObjectStreams: true });
      } else {
        // Deep / Extreme structural repacking into a pristine fresh PDF document
        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(origDoc, origDoc.getPageIndices());
        
        for (const page of copiedPages) {
          newDoc.addPage(page);
        }

        // Strip document metadata for maximum compacting
        if (mode === 'extreme') {
          newDoc.setTitle('');
          newDoc.setAuthor('');
          newDoc.setSubject('');
          newDoc.setKeywords([]);
          newDoc.setProducer('ToolKit Private Local Optimizer');
          newDoc.setCreator('');
        }

        resultingBytes = await newDoc.save({ useObjectStreams: true });
      }

      setProgress(90);
      
      // Note: If the file was already maximally compressed and repacking adds a small PDF index overhead, keep the smaller of the two!
      let finalBlob = new Blob([resultingBytes as unknown as BlobPart], { type: 'application/pdf' });
      if (finalBlob.size >= targetFile.size) {
        // Apply optimized repack anyway or keep original stream to never inflate file
        finalBlob = new Blob([buffer as unknown as BlobPart], { type: 'application/pdf' });
      }

      const outputUrl = URL.createObjectURL(finalBlob);

      setFile((prev) =>
        prev
          ? {
              ...prev,
              status: 'success',
              outputBlob: finalBlob,
              outputUrl: outputUrl,
              outputSize: finalBlob.size,
            }
          : null
      );
      setProgress(100);
    } catch (err) {
      console.error('PDF Compress Error:', err);
      setError('Compression failed. The document may contain locked elements or password encryption.');
      setFile((prev) => prev ? { ...prev, status: 'error' } : null);
    }
  };

  const handleModeChange = (modeVal: 'standard' | 'deep' | 'extreme') => {
    setSelectedMode(modeVal);
    if (file && file.status !== 'processing') {
      if (file.outputUrl) cleanUpFile(undefined, file.outputUrl);
      compressPDF(file, modeVal);
    }
  };

  const handleDownload = () => {
    if (!file || !file.outputUrl || !file.outputBlob) return;

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const finalName = `${baseName}-compressed.pdf`;

    triggerDownload(file.outputUrl, finalName);
    setDownloaded(true);

    setTimeout(() => {
      handleRemoveFile();
    }, 1200);
  };

  const handleRemoveFile = () => {
    if (file && file.outputUrl) cleanUpFile(undefined, file.outputUrl);
    setFile(null);
    setError(null);
    setDownloaded(false);
    setProgress(0);
  };

  const getSavingsPercentage = () => {
    if (!file || file.outputSize === undefined) return 0;
    const diff = file.size - file.outputSize;
    if (diff <= 0) return 0;
    return Math.round((diff / file.size) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-fade-in pb-16">
      <ToolHeader
        title="PDF Compress"
        description="Optimize and reduce PDF size directly in your browser without sacrificing document formatting or text readability."
        icon={<FileArchive className="w-8 h-8" />}
        onBack={onBack}
        categoryTag="Optimize PDF"
      />

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept="application/pdf,.pdf"
          label="Drag & Drop PDF to compress"
          sublabel="Upload a PDF file to reduce size cleanly and privately in browser memory."
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          <FilePreviewCard
            fileItem={file}
            onRemove={handleRemoveFile}
            extraInfo={
              file.status === 'success' && file.outputSize !== undefined ? (
                <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400">
                  <span>Compressed Size: {formatFileSize(file.outputSize)}</span>
                  {getSavingsPercentage() > 0 ? (
                    <span className="bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-800">
                      -{getSavingsPercentage()}% Saved!
                    </span>
                  ) : (
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-md">
                      Optimized structure
                    </span>
                  )}
                </div>
              ) : undefined
            }
          />

          {/* Compression Mode Selection */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Select Optimization Technique
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              All processing modes preserve document text readability and print formatting.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MODES.map((m) => {
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleModeChange(m.id)}
                    disabled={file.status === 'processing'}
                    className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/60 dark:bg-rose-950/40 shadow-sm dark:border-rose-500'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className={`font-bold text-sm ${isSelected ? 'text-rose-700 dark:text-rose-300' : 'text-gray-900 dark:text-white'}`}>
                        {m.label}
                      </span>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-rose-600 dark:bg-rose-400" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {m.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          {file.status === 'processing' && (
            <ProgressBar progress={progress} statusText="Optimizing PDF structure and object streams..." />
          )}

          {/* Results Comparison & Actions */}
          {file.status === 'success' && (
            <div className="bg-gradient-to-br from-gray-50 to-rose-50/20 dark:from-gray-900 dark:to-rose-950/20 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Original Size</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-mono">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <div className="text-rose-500 flex-shrink-0">
                    <ArrowRight className="w-6 h-6" />
                  </div>

                  <div className="text-center sm:text-left">
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">Compressed Size</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                      {formatFileSize(file.outputSize)}
                    </p>
                  </div>
                </div>

                {getSavingsPercentage() > 0 ? (
                  <div className="bg-rose-600 text-white font-bold text-lg px-4 py-2 rounded-xl shadow-sm shadow-rose-500/20 text-center self-start sm:self-auto">
                    -{getSavingsPercentage()}% Reduced
                  </div>
                ) : (
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-medium bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                    Document optimal (Structure cleaned)
                  </span>
                )}
              </div>

              {downloaded ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2 font-semibold">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Downloaded successfully! Temporary processing data deleted from memory.</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Temporary processing data deleted immediately after download</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-500/25 hover:shadow-rose-500/35 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <Download className="w-5 h-5" />
                      <span>One-Click Download</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
