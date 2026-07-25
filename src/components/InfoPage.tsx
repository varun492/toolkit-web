import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Info, Mail, MessageSquare } from 'lucide-react';

export type InfoPageId = 'about' | 'privacy' | 'terms' | 'contact';

interface InfoPageProps {
  page: InfoPageId;
  onBack: () => void;
  onOpenFeedback: () => void;
}

interface Section {
  heading: string;
  body: string[];
}

const CONTENT: Record<InfoPageId, { title: string; intro: string; sections: Section[] }> = {
  about: {
    title: 'About ToolKit',
    intro:
      'ToolKit is a small, focused collection of six file utilities that run entirely inside your web browser. No accounts, no uploads, no clutter.',
    sections: [
      {
        heading: 'What ToolKit does',
        body: [
          'ToolKit provides exactly six tools: Image Compressor, Image Converter, Image Resizer, Image to PDF, PDF Merge and PDF Compress. Each tool does one job well and nothing more.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'Images are decoded with native browser APIs and re-encoded through an HTML5 canvas. PDFs are assembled and optimized with a client-side PDF engine. Because everything happens on your device, processing starts instantly and works even on a slow connection.',
        ],
      },
      {
        heading: 'What ToolKit will never add',
        body: [
          'No sign-up, no premium tier, no advertisements, no tracking dashboards and no newsletter prompts. The tool list stays intentionally short.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'ToolKit is built so that your files never leave your device. This page explains exactly what happens to the data you provide.',
    sections: [
      {
        heading: 'Your files',
        body: [
          'Files you select are read into browser memory only. They are never uploaded to a server, never stored in a database and never shared with a third party. Temporary object URLs created during processing are revoked as soon as you download the result or clear the tool.',
        ],
      },
      {
        heading: 'Local settings',
        body: [
          'A single preference — your light or dark theme choice — is stored in your browser localStorage so the interface looks the same on your next visit. You can clear it at any time through your browser settings.',
        ],
      },
      {
        heading: 'Feedback submissions',
        body: [
          'If you choose to send feedback, only the information you type (optional name, optional email, rating, category and message) plus basic context such as the page address, browser user-agent string and timestamp is emailed to the ToolKit inbox. Feedback is entirely optional and is never linked to the files you process.',
        ],
      },
      {
        heading: 'Analytics and cookies',
        body: [
          'ToolKit sets no advertising cookies and runs no analytics dashboard.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Use',
    intro:
      'By using ToolKit you agree to these straightforward terms. They exist to keep expectations clear for everyone.',
    sections: [
      {
        heading: 'Provided as-is',
        body: [
          'ToolKit is offered free of charge and without warranty of any kind. While the tools are tested carefully, you are responsible for keeping your own backup of any original file before processing it.',
        ],
      },
      {
        heading: 'Acceptable use',
        body: [
          'Use ToolKit only with files you own or have permission to modify, and only for lawful purposes. Because processing happens locally, you retain full ownership of every file and every output you generate.',
        ],
      },
      {
        heading: 'Limitation of liability',
        body: [
          'ToolKit and its maintainers are not liable for data loss, corrupted output or any damages arising from use of the site.',
        ],
      },
      {
        heading: 'Changes',
        body: [
          'These terms may be updated as the project evolves. Continued use of the site after an update constitutes acceptance of the revised terms.',
        ],
      },
    ],
  },
  contact: {
    title: 'Contact',
    intro:
      'Questions, bug reports and feature ideas are always welcome. The fastest route is the built-in feedback form.',
    sections: [
      {
        heading: 'Send feedback',
        body: [
          'Use the Feedback button in the header or footer to open the feedback form. You can attach a star rating, pick a category and describe the issue. Adding your email is optional and only used if a reply is needed.',
        ],
      },
      {
        heading: 'Email',
        body: [
          'You can also write directly to resumeforgecoai@gmail.com.',
        ],
      },
      {
        heading: 'Reporting a bug',
        body: [
          'Bug reports are most useful when they mention which of the six tools you were using, the file type involved and what you expected to happen.',
        ],
      },
    ],
  },
};

const ICONS: Record<InfoPageId, React.ReactNode> = {
  about: <Info className="w-8 h-8" aria-hidden="true" />,
  privacy: <ShieldCheck className="w-8 h-8" aria-hidden="true" />,
  terms: <FileText className="w-8 h-8" aria-hidden="true" />,
  contact: <Mail className="w-8 h-8" aria-hidden="true" />,
};

export const InfoPage: React.FC<InfoPageProps> = ({ page, onBack, onOpenFeedback }) => {
  const content = CONTENT[page];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-fade-in pb-16">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 mb-6 px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-all hover:-translate-x-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to Home</span>
      </button>

      <article className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pb-6 mb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
            {ICONS[page]}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
              {content.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
              {content.intro}
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        {page === 'contact' && (
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onOpenFeedback}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 hover:shadow-blue-500/35 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
              <span>Open Feedback Form</span>
            </button>
          </div>
        )}
      </article>
    </div>
  );
};
