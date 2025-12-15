/**
 * Image optimization utilities for free tier
 * Compresses images to 300-600px to save storage
 */

export const IMAGE_SIZES = {
  thumbnail: 300,
  medium: 600,
  original: 1920,
} as const;

export function getImageUrl(
  url: string | null,
  size: keyof typeof IMAGE_SIZES = 'medium'
): string | null {
  if (!url) return null;

  // If it's a Supabase storage URL, add transform parameters
  if (url.includes('supabase.co/storage')) {
    const sizeValue = IMAGE_SIZES[size];
    // Supabase Storage supports image transformations via query params
    return `${url}?width=${sizeValue}&quality=80`;
  }

  return url;
}

export async function compressImage(file: File, maxWidth: number = 600): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

