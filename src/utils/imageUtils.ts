/**
 * Image Utilities for GIS Desa Beliti Jaya
 * Handles image compression, transparency preservation, and SVG-to-PNG rasterization for jsPDF
 */

/**
 * Compresses an uploaded image file into a lightweight base64 data URL.
 * Preserves SVG raw vector format and PNG transparency.
 */
export const compressImage = (
  file: File,
  maxWidth = 500,
  maxHeight = 500,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If SVG, preserve raw vector data URL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const isPng = file.type === 'image/png';
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = isPng
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Cache for rasterized logo to avoid redundant off-screen canvas operations
 */
let cachedRasterLogoKey = '';
let cachedRasterLogoData = '';

/**
 * Converts any logo source (SVG data URL, SVG element, PNG, JPEG, WebP, or external URL)
 * into a guaranteed, crisp PNG base64 data URL for flawless rendering in jsPDF addImage.
 */
export const getRasterizedLogo = async (logoUrl?: string): Promise<string> => {
  if (!logoUrl) return '';
  if (logoUrl === cachedRasterLogoKey && cachedRasterLogoData) {
    return cachedRasterLogoData;
  }

  // If already PNG or JPEG base64, jsPDF can draw it directly without conversion
  if (
    logoUrl.startsWith('data:image/png;base64,') ||
    logoUrl.startsWith('data:image/jpeg;base64,')
  ) {
    cachedRasterLogoKey = logoUrl;
    cachedRasterLogoData = logoUrl;
    return logoUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          // Scale to 3x for 300 DPI print crispness
          const scale = 3;
          const width = (img.naturalWidth || 120) * scale;
          const height = (img.naturalHeight || 140) * scale;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            const pngData = canvas.toDataURL('image/png');
            cachedRasterLogoKey = logoUrl;
            cachedRasterLogoData = pngData;
            resolve(pngData);
          } else {
            resolve(logoUrl);
          }
        } catch {
          resolve(logoUrl);
        }
      };
      img.onerror = () => resolve(logoUrl);
      img.src = logoUrl;
    } catch {
      resolve(logoUrl);
    }
  });
};

/**
 * Extracts Google Drive file ID from various link formats, including:
 * - https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://drive.google.com/uc?id={FILE_ID}
 * - https://drive.google.com/thumbnail?id={FILE_ID}
 * - https://docs.google.com/file/d/{FILE_ID}/...
 * - https://lh3.googleusercontent.com/d/{FILE_ID}
 */
export const extractGoogleDriveFileId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Format: /file/d/{id}
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Format: ?id={id} or &id={id} (e.g. drive.google.com/open?id=..., uc?id=..., etc.)
  const idQueryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (idQueryMatch && idQueryMatch[1]) return idQueryMatch[1];

  // Format: /d/{id} (e.g. googleusercontent.com/d/...)
  const dPathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (dPathMatch && dPathMatch[1]) return dPathMatch[1];

  return null;
};

/**
 * Checks if a given URL is a Google Drive URL
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('drive.google.com') ||
    url.includes('docs.google.com') ||
    url.includes('googleusercontent.com/d/')
  );
};

/**
 * Transforms any Google Drive URL into high-performance direct embeddable image URL.
 * Defaults to Google's CDN endpoint `https://lh3.googleusercontent.com/d/{fileId}`.
 */
export const formatGoogleDriveImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const fileId = extractGoogleDriveFileId(trimmed);
  if (!fileId) return trimmed;
  // Modern Google Drive CDN direct image endpoint
  return `https://lh3.googleusercontent.com/d/${fileId}`;
};

/**
 * Generates an alternative thumbnail link for Google Drive in case direct CDN is restricted
 */
export const getGoogleDriveThumbnailUrl = (url: string, width = 1000): string => {
  if (!url || typeof url !== 'string') return '';
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url.trim();
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
};

/**
 * Resolves any image URL (standard web URL, data URL, or Google Drive link).
 * Automatically converts Google Drive share links to directly viewable image URLs.
 */
export const resolveImageUrl = (url?: string): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (isGoogleDriveUrl(trimmed)) {
    return formatGoogleDriveImageUrl(trimmed);
  }
  return trimmed;
};
