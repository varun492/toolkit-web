export type ToolId =
  | 'image-compressor'
  | 'image-converter'
  | 'image-resizer'
  | 'image-to-pdf'
  | 'pdf-merge'
  | 'pdf-compress';

export interface ToolItem {
  id: ToolId;
  title: string;
  description: string;
  category: 'image' | 'pdf';
  formats: string;
  badge?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  dimensions?: { width: number; height: number };
  pageCount?: number; // For PDFs
  status: 'idle' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  outputBlob?: Blob;
  outputUrl?: string;
  outputSize?: number;
}

export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface CompressionLevel {
  label: string;
  value: 'low' | 'medium' | 'high';
  quality: number; // 0 to 1
  description: string;
}
