import React, { memo, useCallback } from 'react';
import type { ToolId, ToolItem } from '../types';
import {
  Minimize2,
  RefreshCw,
  Maximize2,
  FileUp,
  Layers,
  FileArchive,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
} from 'lucide-react';

interface HomeProps {
  onSelectTool: (id: ToolId) => void;
}

const TOOLS: ToolItem[] = [
  {
    id: 'image-compressor',
    title: 'Image Compressor',
    description:
      'Compress JPG, PNG and WebP images instantly while preserving top image quality with customizable compression levels.',
    category: 'image',
    formats: 'JPG, PNG, WebP',
    badge: 'Popular',
  },
  {
    id: 'image-converter',
    title: 'Image Converter',
    description:
      'Convert smoothly between JPG, PNG, and WebP formats in seconds without losing visual fidelity.',
    category: 'image',
    formats: 'JPG ↔ PNG ↔ WebP',
  },
  {
    id: 'image-resizer',
    title: 'Image Resizer',
    description:
      'Resize image dimensions cleanly by custom pixel width and height with optional aspect ratio lock.',
    category: 'image',
    formats: 'JPG, PNG, WebP',
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    description:
      'Combine single or multiple images into a professional, single PDF document with easy drag-and-drop page ordering.',
    category: 'pdf',
    formats: 'Images → PDF',
    badge: 'Fast',
  },
  {
    id: 'pdf-merge',
    title: 'PDF Merge',
    description:
      'Upload multiple PDF documents, organize their sequence, and merge them seamlessly into one unified PDF.',
    category: 'pdf',
    formats: 'PDF + PDF → PDF',
  },
  {
    id: 'pdf-compress',
    title: 'PDF Compress',
    description:
      'Optimize and reduce PDF file size while preserving clear document readability and crisp formatting.',
    category: 'pdf',
    formats: 'Optimize PDF',
  },
];

const ICON_CLASS = 'w-6 h-6';

const TOOL_ICONS: Record<ToolId, React.ReactNode> = {
  'image-compressor': <Minimize2 className={`${ICON_CLASS} text-blue-600 dark:text-blue-400`} aria-hidden="true" />,
  'image-converter': <RefreshCw className={`${ICON_CLASS} text-emerald-600 dark:text-emerald-400`} aria-hidden="true" />,
  'image-resizer': <Maximize2 className={`${ICON_CLASS} text-indigo-600 dark:text-indigo-400`} aria-hidden="true" />,
  'image-to-pdf': <FileUp className={`${ICON_CLASS} text-purple-600 dark:text-purple-400`} aria-hidden="true" />,
  'pdf-merge': <Layers className={`${ICON_CLASS} text-amber-600 dark:text-amber-400`} aria-hidden="true" />,
  'pdf-compress': <FileArchive className={`${ICON_CLASS} text-rose-600 dark:text-rose-400`} aria-hidden="true" />,
};

const ICON_BG: Record<ToolId, string> = {
  'image-compressor': 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800/80',
  'image-converter': 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/80',
  'image-resizer': 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800/80',
  'image-to-pdf': 'bg-purple-50 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800/80',
  'pdf-merge': 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/80',
  'pdf-compress': 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800/80',
};

interface ToolCardProps {
  tool: ToolItem;
  onSelect: (id: ToolId) => void;
}

const ToolCard = memo(({ tool, onSelect }: ToolCardProps) => {
  const handleClick = useCallback(() => onSelect(tool.id), [onSelect, tool.id]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Open ${tool.title}`}
      className="group relative flex flex-col justify-between text-left w-full h-full bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-lg dark:hover:shadow-blue-950/20 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all duration-200 hover:-translate-y-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="w-full">
        <div className="flex items-start justify-between gap-3 mb-5">
          <span
            className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100 shadow-xs ${ICON_BG[tool.id]}`}
          >
            {TOOL_ICONS[tool.id]}
          </span>

          <span className="flex flex-wrap items-center justify-end gap-2">
            {tool.badge && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs shadow-blue-500/20">
                {tool.badge}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {tool.formats}
            </span>
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {tool.title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          {tool.description}
        </p>
      </div>

      <span className="w-full pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-sm font-semibold text-blue-600 dark:text-blue-400">
        <span>Open Tool</span>
        <ArrowRight
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
          aria-hidden="true"
        />
      </span>
    </button>
  );
});

ToolCard.displayName = 'ToolCard';

export const Home: React.FC<HomeProps> = memo(({ onSelectTool }) => {
  return (
    <div className="animate-fade-in pb-12">
      {/* Hero */}
      <section className="text-center py-12 sm:py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <p className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold mb-6 shadow-xs">
          <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
          <span>Professional Local File Tools</span>
        </p>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 leading-[1.15] text-balance">
          Your Everyday{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-300">
            File ToolKit
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10">
          Six focused, high-performance tools for your image and PDF conversion needs. Fast,
          uncluttered, and completely private—files never leave your browser.
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium list-none p-0 m-0">
          <li className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
            <span>Zero Uploads to Servers</span>
          </li>
          <li className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" aria-hidden="true" />
            <span>Instant Client-Side Processing</span>
          </li>
          <li className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
            <span>No Signup or Accounts</span>
          </li>
        </ul>
      </section>

      {/* Tools */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6" aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="sr-only">
          All ToolKit tools
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />
          ))}
        </div>
      </section>
    </div>
  );
});

Home.displayName = 'Home';
