import { memo } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  statusText?: string;
  isComplete?: boolean;
  estimate?: string;
}

export const ProgressBar = memo(
  ({ progress, statusText = 'Processing file...', isComplete = false, estimate }: ProgressBarProps) => {
    const value = Math.min(100, Math.max(0, Math.round(progress)));
    const phase = isComplete
      ? 'Finishing up'
      : value < 35
        ? 'Reading and decoding file'
        : value < 70
          ? 'Processing content'
          : 'Encoding output';

    return (
      <div className="w-full bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-5 rounded-2xl shadow-xs animate-fade-in">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="flex items-center gap-2.5 min-w-0">
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
            ) : (
              <Loader2
                className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0 motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
              {isComplete ? 'Processing complete!' : statusText}
            </span>
          </p>
          <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex-shrink-0">
            {value}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={statusText}
          className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-200/60 dark:border-gray-700/50"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out motion-reduce:transition-none ${
              isComplete
                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                : 'bg-blue-600 shadow-sm shadow-blue-500/50'
            }`}
            style={{ width: `${value}%` }}
          />
        </div>

        <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400" role="status">
          {estimate ?? `${phase} — usually takes just a moment.`}
        </p>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
