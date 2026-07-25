import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { ToolId } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { FeedbackModal } from './components/FeedbackModal';
import { InfoPage, type InfoPageId } from './components/InfoPage';
import { applySeo, type RouteId } from './utils/seo';

// Tool pages are code-split so the homepage ships the smallest possible bundle.
const ImageCompressor = lazy(() =>
  import('./tools/ImageCompressor').then((m) => ({ default: m.ImageCompressor }))
);
const ImageConverter = lazy(() =>
  import('./tools/ImageConverter').then((m) => ({ default: m.ImageConverter }))
);
const ImageResizer = lazy(() =>
  import('./tools/ImageResizer').then((m) => ({ default: m.ImageResizer }))
);
const ImageToPDF = lazy(() => import('./tools/ImageToPDF').then((m) => ({ default: m.ImageToPDF })));
const PDFMerge = lazy(() => import('./tools/PDFMerge').then((m) => ({ default: m.PDFMerge })));
const PDFCompress = lazy(() => import('./tools/PDFCompress').then((m) => ({ default: m.PDFCompress })));

const TOOL_IDS: ToolId[] = [
  'image-compressor',
  'image-converter',
  'image-resizer',
  'image-to-pdf',
  'pdf-merge',
  'pdf-compress',
];

const INFO_IDS: InfoPageId[] = ['about', 'privacy', 'terms', 'contact'];

const TOOL_TITLES: Record<ToolId, string> = {
  'image-compressor': 'Image Compressor',
  'image-converter': 'Image Converter',
  'image-resizer': 'Image Resizer',
  'image-to-pdf': 'Image to PDF',
  'pdf-merge': 'PDF Merge',
  'pdf-compress': 'PDF Compress',
};

const INFO_TITLES: Record<InfoPageId, string> = {
  about: 'About',
  privacy: 'Privacy Policy',
  terms: 'Terms of Use',
  contact: 'Contact',
};

function parseHash(): RouteId {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  if ((TOOL_IDS as string[]).includes(raw)) return raw as ToolId;
  if ((INFO_IDS as string[]).includes(raw)) return raw as InfoPageId;
  return 'home';
}

const RouteFallback = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
    <Loader2 className="w-7 h-7 animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
    <p className="text-sm font-medium" role="status">
      Loading tool…
    </p>
  </div>
);

export function App() {
  const [route, setRoute] = useState<RouteId>(() =>
    typeof window === 'undefined' ? 'home' : parseHash()
  );
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('toolkit-theme-dark');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Theme persistence
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('toolkit-theme-dark', String(darkMode));
  }, [darkMode]);

  // Keep view in sync with browser back/forward navigation
  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Dynamic metadata for the active view
  useEffect(() => {
    applySeo(route);
  }, [route]);

  const navigate = useCallback((next: RouteId) => {
    const target = next === 'home' ? ' ' : `#/${next}`;
    if (next === 'home') {
      history.pushState('', document.title, window.location.pathname + window.location.search);
      setRoute('home');
    } else if (window.location.hash !== target) {
      window.location.hash = `/${next}`;
    } else {
      setRoute(next);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goHome = useCallback(() => navigate('home'), [navigate]);
  const openFeedback = useCallback(() => setIsFeedbackOpen(true), []);
  const closeFeedback = useCallback(() => setIsFeedbackOpen(false), []);
  const toggleDarkMode = useCallback(() => setDarkMode((prev) => !prev), []);

  const isTool = (TOOL_IDS as string[]).includes(route);
  const isInfo = (INFO_IDS as string[]).includes(route);

  const breadcrumb = isTool
    ? TOOL_TITLES[route as ToolId]
    : isInfo
      ? INFO_TITLES[route as InfoPageId]
      : '';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200 selection:bg-blue-500/20 selection:text-blue-600 dark:selection:text-blue-400">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-blue-600 focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onGoHome={goHome}
        onOpenFeedback={openFeedback}
        currentToolName={breadcrumb}
      />

      <main id="main-content" className="flex-grow pt-4 sm:pt-8">
        {route === 'home' && <Home onSelectTool={navigate} />}

        {isInfo && (
          <InfoPage page={route as InfoPageId} onBack={goHome} onOpenFeedback={openFeedback} />
        )}

        {isTool && (
          <Suspense fallback={<RouteFallback />}>
            {route === 'image-compressor' && <ImageCompressor onBack={goHome} />}
            {route === 'image-converter' && <ImageConverter onBack={goHome} />}
            {route === 'image-resizer' && <ImageResizer onBack={goHome} />}
            {route === 'image-to-pdf' && <ImageToPDF onBack={goHome} />}
            {route === 'pdf-merge' && <PDFMerge onBack={goHome} />}
            {route === 'pdf-compress' && <PDFCompress onBack={goHome} />}
          </Suspense>
        )}
      </main>

      <Footer onOpenFeedback={openFeedback} onNavigate={navigate} />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={closeFeedback}
        currentToolName={breadcrumb || 'Homepage'}
      />
    </div>
  );
}

export default App;
