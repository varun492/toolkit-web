import type { ToolId } from '../types';

export type RouteId = 'home' | 'about' | 'privacy' | 'terms' | 'contact' | ToolId;

export const SITE_NAME = 'ToolKit';
export const SITE_URL = 'https://toolkit-files.pages.dev';

interface SeoEntry {
  path: string;
  title: string;
  description: string;
  keywords: string;
}

export const SEO_CONFIG: Record<RouteId, SeoEntry> = {
  home: {
    path: '/',
    title: 'ToolKit — Fast & Private Online Image and PDF Tools',
    description:
      'Six focused file tools: Image Compressor, Image Converter, Image Resizer, Image to PDF, PDF Merge and PDF Compress. Files are processed 100% locally in your browser.',
    keywords:
      'online file tools, image compressor, image converter, image resizer, image to pdf, pdf merge, pdf compress, private file tools',
  },
  'image-compressor': {
    path: '/#/image-compressor',
    title: 'Image Compressor — Compress JPG, PNG & WebP Online | ToolKit',
    description:
      'Compress JPG, PNG and WebP images in your browser with Low, Medium and High compression levels. See original and compressed size instantly. No uploads.',
    keywords: 'image compressor, compress jpg, compress png, compress webp, reduce image size online',
  },
  'image-converter': {
    path: '/#/image-converter',
    title: 'Image Converter — Convert JPG, PNG & WebP Online | ToolKit',
    description:
      'Convert images between JPG, PNG and WebP formats locally in your browser while preserving quality. Free, fast and completely private.',
    keywords: 'image converter, jpg to png, png to webp, webp to jpg, convert image format online',
  },
  'image-resizer': {
    path: '/#/image-resizer',
    title: 'Image Resizer — Resize Images by Width & Height | ToolKit',
    description:
      'Resize images to exact pixel dimensions with an optional aspect ratio lock and quick scale presets. Runs entirely in your browser.',
    keywords: 'image resizer, resize image online, change image dimensions, scale image, aspect ratio',
  },
  'image-to-pdf': {
    path: '/#/image-to-pdf',
    title: 'Image to PDF — Convert Multiple Images to One PDF | ToolKit',
    description:
      'Combine multiple JPG, PNG and WebP images into a single PDF. Drag to reorder pages and choose fit-to-image or A4 page size. No uploads required.',
    keywords: 'image to pdf, jpg to pdf, png to pdf, convert images to pdf, combine images pdf',
  },
  'pdf-merge': {
    path: '/#/pdf-merge',
    title: 'PDF Merge — Combine Multiple PDF Files Online | ToolKit',
    description:
      'Merge multiple PDF documents into one file. Drag to reorder documents and download instantly. All merging happens locally in your browser.',
    keywords: 'pdf merge, combine pdf, join pdf files, merge pdf online free',
  },
  'pdf-compress': {
    path: '/#/pdf-compress',
    title: 'PDF Compress — Reduce PDF File Size Online | ToolKit',
    description:
      'Compress PDF files and reduce their size while preserving readability. Three optimization modes with before and after size comparison.',
    keywords: 'pdf compress, reduce pdf size, shrink pdf, optimize pdf online',
  },
  about: {
    path: '/#/about',
    title: 'About ToolKit — Private, Local File Processing',
    description:
      'Learn how ToolKit processes images and PDFs entirely inside your browser with no accounts, no uploads, no ads and no tracking.',
    keywords: 'about toolkit, local file processing, private online tools',
  },
  privacy: {
    path: '/#/privacy',
    title: 'Privacy Policy — ToolKit',
    description:
      'ToolKit privacy policy: files never leave your device, no accounts, no databases and no analytics dashboards. Learn exactly what data is handled.',
    keywords: 'toolkit privacy policy, private file tools, no upload file converter',
  },
  terms: {
    path: '/#/terms',
    title: 'Terms of Use — ToolKit',
    description:
      'The terms of use for ToolKit, a free browser-based collection of six image and PDF utilities provided as-is.',
    keywords: 'toolkit terms of use, terms and conditions',
  },
  contact: {
    path: '/#/contact',
    title: 'Contact ToolKit — Send Feedback',
    description:
      'Get in touch with the ToolKit team. Report a bug, request a feature or share an improvement suggestion through the feedback form.',
    keywords: 'contact toolkit, toolkit feedback, report bug',
  },
};

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Applies dynamic, non-duplicated metadata for the active view.
 * Existing tags from index.html are updated in place instead of appended.
 */
export function applySeo(route: RouteId): void {
  const entry = SEO_CONFIG[route] ?? SEO_CONFIG.home;
  const canonical = `${SITE_URL}${entry.path}`;

  document.title = entry.title;

  setMeta('meta[name="description"]', 'name', 'description', entry.description);
  setMeta('meta[name="keywords"]', 'name', 'keywords', entry.keywords);

  setMeta('meta[property="og:title"]', 'property', 'og:title', entry.title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', entry.description);
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);

  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', entry.title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', entry.description);

  setLink('canonical', canonical);
}
