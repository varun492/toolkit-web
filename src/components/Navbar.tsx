import React from 'react';
import { ShieldCheck, Sun, Moon, Wrench, ChevronRight, MessageSquare } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onGoHome: () => void;
  onOpenFeedback: () => void;
  currentToolName?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  onGoHome,
  onOpenFeedback,
  currentToolName,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo, Tagline, and Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg group"
            aria-label="ToolKit Home"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              <Wrench className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              ToolKit
            </span>
          </button>

          {currentToolName && (
            <div className="flex items-center gap-1 sm:gap-2 text-gray-400 dark:text-gray-500 font-medium text-sm">
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-200 font-semibold truncate max-w-[150px] sm:max-w-none">
                {currentToolName}
              </span>
            </div>
          )}

          {!currentToolName && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
              Fast & Private
            </span>
          )}
        </div>

        {/* Right Action Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Processed locally in browser</span>
          </div>

          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Open Feedback Modal"
            title="Send Feedback"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
            <span className="hidden xs:inline-block font-bold">Feedback</span>
            <span className="inline-block xs:hidden font-bold">Feedback</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 transition-transform hover:-rotate-12" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
