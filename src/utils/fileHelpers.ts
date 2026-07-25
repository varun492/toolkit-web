export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const VALID_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/x-webp'
];

export const VALID_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Validates whether a file has an acceptable JPG, PNG, or WebP MIME type and extension before decoding.
 */
export function validateImageMimeType(mimeType?: string, filename?: string): boolean {
  const cleanMime = (mimeType || '').toLowerCase().trim();
  const cleanName = (filename || '').toLowerCase().trim();
  const extension = cleanName.slice((Math.max(0, cleanName.lastIndexOf('.')) || Infinity) + 1);

  const isValidMime = VALID_IMAGE_MIME_TYPES.includes(cleanMime) || cleanMime.startsWith('image/');
  const isValidExt = VALID_IMAGE_EXTENSIONS.includes(extension);

  if (cleanMime !== '') {
    return isValidMime || isValidExt;
  }
  return isValidExt;
}

/**
 * Normalizes variations of JPG, PNG, and WebP MIME types to standard formats.
 */
export function normalizeImageMimeType(mimeType?: string, filename?: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const cleanMime = (mimeType || '').toLowerCase().trim();
  const cleanName = (filename || '').toLowerCase().trim();
  const ext = cleanName.slice((Math.max(0, cleanName.lastIndexOf('.')) || Infinity) + 1);

  if (cleanMime === 'image/jpeg' || cleanMime === 'image/jpg' || cleanMime === 'image/pjpeg' || ext === 'jpg' || ext === 'jpeg') {
    return 'image/jpeg';
  }
  if (cleanMime === 'image/png' || cleanMime === 'image/x-png' || ext === 'png') {
    return 'image/png';
  }
  if (cleanMime === 'image/webp' || cleanMime === 'image/x-webp' || ext === 'webp') {
    return 'image/webp';
  }
  return 'image/png';
}

export interface DecodedImage {
  width: number;
  height: number;
  source: ImageBitmap | HTMLImageElement;
  close: () => void;
}

/**
 * Reads a Blob or File into a base64 Data URL using FileReader as a fallback for Blob decoding.
 */
export async function readBlobAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not output a string'));
      }
    };
    reader.onerror = () => {
      reject(new Error('FileReader failed to read file'));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Robust browser-native image decoding pipeline.
 * - Validates MIME type first.
 * - Prioritizes createImageBitmap with EXIF orientation preservation ('from-image').
 * - Falls back to Blob URL + HTMLImageElement.decode().
 * - Falls back to FileReader Data URL + HTMLImageElement.decode().
 * Ensures valid JPG, PNG, and WebP images are never erroneously treated as corrupted.
 */
export async function decodeImage(fileOrBlob: Blob | File): Promise<DecodedImage> {
  const mimeType = fileOrBlob.type || '';
  const filename = 'name' in fileOrBlob ? (fileOrBlob as File).name : '';

  // 1. Validate MIME type before attempting to decode
  if (!validateImageMimeType(mimeType, filename)) {
    throw new Error('Unsupported or invalid image MIME type. Please provide a JPG, PNG, or WebP file.');
  }

  // 2. Try native ImageBitmap decoding with EXIF orientation preservation
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await window.createImageBitmap(fileOrBlob, {
        imageOrientation: 'from-image',
        colorSpaceConversion: 'default',
      } as ImageBitmapOptions);

      return {
        width: bitmap.width,
        height: bitmap.height,
        source: bitmap,
        close: () => {
          if (typeof bitmap.close === 'function') {
            try { bitmap.close(); } catch {}
          }
        },
      };
    } catch (bitmapOptionsError) {
      // Retry without options object if browser engine doesn't support ImageBitmapOptions dictionary or specific codec option
      try {
        const bitmap = await window.createImageBitmap(fileOrBlob);
        return {
          width: bitmap.width,
          height: bitmap.height,
          source: bitmap,
          close: () => {
            if (typeof bitmap.close === 'function') {
              try { bitmap.close(); } catch {}
            }
          },
        };
      } catch (bitmapFallbackError) {
        // Continue to Blob/HTMLImageElement fallback without failing valid images
      }
    }
  }

  // 3. Try Blob ObjectURL + HTMLImageElement native decoding
  let blobUrl: string | undefined;
  try {
    blobUrl = URL.createObjectURL(fileOrBlob);
    const decodedFromBlob = await decodeWithImageElement(blobUrl, true);
    return decodedFromBlob;
  } catch (blobError) {
    if (blobUrl) {
      try { URL.revokeObjectURL(blobUrl); } catch {}
    }
    // Continue to FileReader fallback
  }

  // 4. Try FileReader Data URL + HTMLImageElement native decoding
  try {
    const dataUrl = await readBlobAsDataURL(fileOrBlob);
    const decodedFromData = await decodeWithImageElement(dataUrl, false);
    return decodedFromData;
  } catch (readerError) {
    throw new Error('Failed to decode image across ImageBitmap, Blob, and FileReader pipelines.');
  }
}

async function decodeWithImageElement(src: string, isBlobUrl: boolean): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.style.imageOrientation = 'from-image';

    const cleanUp = () => {
      if (isBlobUrl && src.startsWith('blob:')) {
        try { URL.revokeObjectURL(src); } catch {}
      }
    };

    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') {
          await img.decode();
        }
      } catch (e) {
        // If decode() rejects due to already being loaded or browser behavior, proceed since onload fired cleanly
      }
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        source: img,
        close: cleanUp,
      });
    };

    img.onerror = () => {
      cleanUp();
      reject(new Error('HTMLImageElement failed to load image source'));
    };

    img.src = src;
  });
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    const decoded = await decodeImage(file);
    const dimensions = { width: decoded.width, height: decoded.height };
    decoded.close();
    return dimensions;
  } catch (error) {
    throw new Error('Failed to load image dimensions');
  }
}

export function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function cleanUpFile(previewUrl?: string, outputUrl?: string): void {
  if (previewUrl && previewUrl.startsWith('blob:')) {
    try { URL.revokeObjectURL(previewUrl); } catch {}
  }
  if (outputUrl && outputUrl.startsWith('blob:')) {
    try { URL.revokeObjectURL(outputUrl); } catch {}
  }
}

export function getFileExtension(filename: string): string {
  return filename.slice((Math.max(0, filename.lastIndexOf('.')) || Infinity) + 1).toLowerCase();
}

/** Practical browser-memory limits so very large files fail fast with a clear message. */
export const MAX_IMAGE_BYTES = 30 * 1024 * 1024; // 30 MB
export const MAX_PDF_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * Validates a selected file and returns a user-friendly error message, or null when the file is fine.
 */
export function validateSelectedFile(file: File, kind: 'image' | 'pdf'): string | null {
  if (file.size === 0) {
    return `"${file.name}" is empty (0 bytes). Please choose a different file.`;
  }

  if (kind === 'image') {
    if (!validateImageMimeType(file.type, file.name)) {
      return `"${file.name}" is not a supported image. Please use a JPG, PNG or WebP file.`;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `"${file.name}" is ${formatFileSize(file.size)}, which is above the ${formatFileSize(
        MAX_IMAGE_BYTES
      )} limit for in-browser image processing. Try a smaller image.`;
    }
    return null;
  }

  const isPdf = file.type === 'application/pdf' || getFileExtension(file.name) === 'pdf';
  if (!isPdf) {
    return `"${file.name}" is not a PDF document. Please choose a file ending in .pdf.`;
  }
  if (file.size > MAX_PDF_BYTES) {
    return `"${file.name}" is ${formatFileSize(file.size)}, which is above the ${formatFileSize(
      MAX_PDF_BYTES
    )} limit for in-browser PDF processing.`;
  }
  return null;
}

/**
 * Converts a thrown processing error into a clear, non-technical message.
 */
export function describeProcessingError(error: unknown, kind: 'image' | 'pdf'): string {
  const raw = error instanceof Error ? error.message.toLowerCase() : '';

  if (raw.includes('encrypt') || raw.includes('password')) {
    return 'This PDF is password protected, so it cannot be processed. Please remove the password and try again.';
  }
  if (raw.includes('mime') || raw.includes('unsupported')) {
    return 'That file format is not supported. Please use JPG, PNG or WebP for images, or PDF for documents.';
  }
  if (raw.includes('memory') || raw.includes('allocation')) {
    return 'Your browser ran out of memory while processing this file. Try a smaller file or close other tabs.';
  }
  if (kind === 'pdf') {
    return 'This PDF could not be read. It may be corrupted, incomplete or protected. Please try another file.';
  }
  return 'This image could not be decoded. It may be corrupted or saved in an unsupported variation. Please try another file.';
}
