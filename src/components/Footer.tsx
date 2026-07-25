import React from 'react';
import { Lock, MessageSquare } from 'lucide-react';
import type { InfoPageId } from './InfoPage';

interface FooterProps {
  onOpenFeedback: () => void;
  onNavigate: (page: 'home' | InfoPageId) => void;
}

const LINKS: { label: string; target: 'home' | InfoPageId }[] = [
  { label: 'Home', target: 'home' },
  { label: 'About', target: 'about' },
  { label: 'Privacy', target: 'privacy' },
  { label: 'Terms', target: 'terms' },
  { label: 'Contact', target: 'contact' },
];

export const Footer: React.FC<FooterProps> = ({ onOpenFeedback, onNavigate }) => {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 py-8 px-4 sm:px-6 mt-auto bg-gray-50/50 dark:bg-gray-950/30 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="min-w-0">
            <span className="font-semibold text-gray-900 dark:text-gray-100">ToolKit</span>
            <span className="mx-2 text-gray-300 dark:text-gray-700" aria-hidden="true">•</span>
            <span>Simple, clean, and private file processing tools.</span>
          </p>

          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 font-medium bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" aria-hidden="true" />
            <span>No accounts. No ads. No data collection. 100% Client-Side.</span>
          </div>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-2 pt-5 border-t border-gray-200/80 dark:border-gray-800"
        >
          {LINKS.map((link) => (
            <button
              key={link.target}
              type="button"
              onClick={() => onNavigate(link.target)}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-900 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {link.label}
            </button>
          ))}

          <button
            type="button"
            onClick={onOpenFeedback}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>Feedback</span>
          </button>

          <span className="ml-auto hidden sm:block text-xs text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} ToolKit
          </span>
        </nav>
      </div>
    </footer>
  );
};
