import React, { type ReactNode } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface ToolHeaderProps {
  title: string;
  description: string;
  icon: ReactNode;
  onBack: () => void;
  categoryTag?: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  title,
  description,
  icon,
  onBack,
  categoryTag = 'Local Tool',
}) => {
  return (
    <div className="mb-8 animate-fade-in">
      {/* Back to Home Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 mb-6 px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-all hover:-translate-x-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-6 sm:p-8 rounded-2xl shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {categoryTag}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-800 pt-4 sm:pt-0 sm:pl-6 text-xs text-gray-500 dark:text-gray-400 gap-2">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Browser Privileged</span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-[11px]">No uploads to servers</span>
        </div>
      </div>
    </div>
  );
};
