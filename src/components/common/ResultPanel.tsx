import { memo } from 'react';
import { Download, Trash2, ArrowRight, CheckCircle2, ShieldCheck, RotateCcw } from 'lucide-react';
import { formatFileSize } from '../../utils/fileHelpers';

export type Accent = 'blue' | 'emerald' | 'indigo' | 'purple' | 'amber' | 'rose';

interface AccentStyles {
  wrapper: string;
  text: string;
  button: string;
  badge: string;
  arrow: string;
}

const ACCENTS: Record<Accent, AccentStyles> = {
  blue: {
    wrapper: 'from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20',
    text: 'text-blue-600 dark:text-blue-400',
    button:
      'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 hover:shadow-blue-500/35 focus-visible:ring-blue-500',
    badge: 'bg-blue-600',
    arrow: 'text-blue-500',
  },
  emerald: {
    wrapper: 'from-gray-50 to-emerald-50/30 dark:from-gray-900 dark:to-emerald-950/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    button:
      'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 hover:shadow-emerald-500/35 focus-visible:ring-emerald-500',
    badge: 'bg-emerald-600',
    arrow: 'text-emerald-500',
  },
  indigo: {
    wrapper: 'from-gray-50 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    button:
      'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25 hover:shadow-indigo-500/35 focus-visible:ring-indigo-500',
    badge: 'bg-indigo-600',
    arrow: 'text-indigo-500',
  },
  purple: {
    wrapper: 'from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20',
    text: 'text-purple-600 dark:text-purple-400',
    button:
      'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25 hover:shadow-purple-500/35 focus-visible:ring-purple-500',
    badge: 'bg-purple-600',
    arrow: 'text-purple-500',
  },
  amber: {
    wrapper: 'from-gray-50 to-amber-50/30 dark:from-gray-900 dark:to-amber-950/20',
    text: 'text-amber-600 dark:text-amber-400',
    button:
      'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25 hover:shadow-amber-500/35 focus-visible:ring-amber-500',
    badge: 'bg-amber-600',
    arrow: 'text-amber-500',
  },
  rose: {
    wrapper: 'from-gray-50 to-rose-50/20 dark:from-gray-900 dark:to-rose-950/20',
    text: 'text-rose-600 dark:text-rose-400',
    button:
      'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25 hover:shadow-rose-500/35 focus-visible:ring-rose-500',
    badge: 'bg-rose-600',
    arrow: 'text-rose-500',
  },
};

interface ResultPanelProps {
  accent: Accent;
  originalSize: number;
  processedSize: number;
  outputName: string;
  meta?: string;
  downloaded: boolean;
  downloadLabel?: string;
  onDownload: () => void;
  onReset: () => void;
}

export const ResultPanel = memo(
  ({
    accent,
    originalSize,
    processedSize,
    outputName,
    meta,
    downloaded,
    downloadLabel = 'Download',
    onDownload,
    onReset,
  }: ResultPanelProps) => {
    const styles = ACCENTS[accent];
    const diff = originalSize - processedSize;
    const savedPercent = originalSize > 0 && diff > 0 ? Math.round((diff / originalSize) * 100) : 0;
    const grew = diff < 0;

    return (
      <section
        aria-label="Processing result"
        className={`bg-gradient-to-br ${styles.wrapper} border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xs animate-fade-in`}
      >
        {/* Success header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-gray-200/70 dark:border-gray-800">
          <p className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>Success — your file is ready</span>
          </p>
          {meta && (
            <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-gray-900/80 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
              {meta}
            </span>
          )}
        </div>

        {/* Size comparison */}
        <div className="flex flex-wrap items-center justify-between gap-5 mb-6">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Original Size</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white font-mono truncate">
                {formatFileSize(originalSize)}
              </p>
            </div>

            <ArrowRight className={`w-6 h-6 flex-shrink-0 ${styles.arrow}`} aria-hidden="true" />

            <div className="min-w-0">
              <p className={`text-xs font-medium mb-1 ${styles.text}`}>Processed Size</p>
              <p className={`text-lg sm:text-2xl font-extrabold font-mono truncate ${styles.text}`}>
                {formatFileSize(processedSize)}
              </p>
            </div>
          </div>

          {savedPercent > 0 ? (
            <p
              className={`${styles.badge} text-white font-bold text-base sm:text-lg px-4 py-2 rounded-xl shadow-sm`}
            >
              −{savedPercent}% saved
            </p>
          ) : (
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
              {grew ? 'Output slightly larger — source already optimized' : 'Already fully optimized'}
            </p>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate mb-6" title={outputName}>
          {outputName}
        </p>

        {downloaded ? (
          <div className="space-y-4">
            <p
              role="status"
              className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2 font-semibold text-sm text-center"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Downloaded — temporary data cleared from memory.</span>
            </p>
            <button
              type="button"
              onClick={onReset}
              className="w-full px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Process another file</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
              <span>Temporary data is deleted immediately after download</span>
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onReset}
                className="px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={onDownload}
                className={`flex-1 sm:flex-none px-6 sm:px-8 py-3.5 rounded-xl text-white font-bold text-sm sm:text-base shadow-md active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 motion-reduce:active:scale-100 ${styles.button}`}
              >
                <Download className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>{downloadLabel}</span>
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }
);

ResultPanel.displayName = 'ResultPanel';
