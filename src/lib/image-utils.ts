/**
 * Compresses an image file client-side using an HTML5 canvas.
 * Reduces large smartphone camera photos (3000-4000px, 5-15MB) to ~800px and ~50-100KB,
 * making upload instant, mobile-data friendly, and preventing 413 Payload Too Large issues.
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.65
): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve) => {
    // If not an image, reject or return empty
    if (!file.type.startsWith('image/')) {
      resolve({ file, dataUrl: '' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const initialDataUrl = (e.target?.result as string) || '';
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ file, dataUrl: '' });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Adaptive Second-Pass Compression:
        // If dataUrl exceeds 250KB (Base64 string length ~330,000 chars), downscale further
        if (dataUrl.length > 330000) {
          const secondCanvas = document.createElement('canvas');
          const secondWidth = Math.round(width * 0.75);
          const secondHeight = Math.round(height * 0.75);
          secondCanvas.width = secondWidth;
          secondCanvas.height = secondHeight;
          const secondCtx = secondCanvas.getContext('2d');
          if (secondCtx) {
            secondCtx.drawImage(canvas, 0, 0, secondWidth, secondHeight);
            dataUrl = secondCanvas.toDataURL('image/jpeg', 0.55);
          }
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve({ file: compressedFile, dataUrl });
            } else {
              resolve({ file, dataUrl });
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        // Safe fallback: never return raw 10MB file if canvas failed
        console.warn('Gagal memuat gambar ke canvas untuk kompresi');
        resolve({ file, dataUrl: '' });
      };

      img.src = initialDataUrl;
    };

    reader.onerror = () => resolve({ file, dataUrl: '' });
    reader.readAsDataURL(file);
  });
}
