/**
 * Helper to safely downscale and compress receipt photos client-side
 * before uploading to prevent browser "Load failed" / 413 Payload Too Large
 * on modern mobile 4K/12MP camera photos and iOS Safari.
 */
export async function prepareReceiptImage(
  input: File | Blob | string,
  maxDimension = 1400,
  quality = 0.82
): Promise<{ dataUrl: string; mimeType: string }> {
  // If string data URL already under 300KB, return as-is
  if (typeof input === 'string' && input.length < 400000 && input.startsWith('data:image/')) {
    const mimeMatch = input.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    return {
      dataUrl: input,
      mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg',
    };
  }

  // Use Image element with ObjectURL for best Safari / mobile memory efficiency
  return new Promise((resolve, reject) => {
    let objectUrl: string | null = null;
    const img = new Image();

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          width = 1200;
          height = 1600;
        }

        // Downscale while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          throw new Error('Canvas 2D rendering is not available');
        }

        // Fill crisp white background for receipts
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG (much smaller payload over network)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        cleanup();

        resolve({
          dataUrl: compressedDataUrl,
          mimeType: 'image/jpeg',
        });
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      cleanup();
      // If objectURL failed, try fallback with FileReader
      if (input instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const w = Math.min(fallbackImg.width || 1200, maxDimension);
              const h = Math.round(((fallbackImg.height || 1600) * w) / (fallbackImg.width || 1200));
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(fallbackImg, 0, 0, w, h);
                resolve({
                  dataUrl: canvas.toDataURL('image/jpeg', quality),
                  mimeType: 'image/jpeg',
                });
                return;
              }
            } catch (e) {
              // Ignore and reject below
            }
            resolve({
              dataUrl: reader.result as string,
              mimeType: 'image/jpeg',
            });
          };
          fallbackImg.onerror = () => {
            reject(new Error('Could not read image file. Please choose a JPG, PNG, or WEBP file.'));
          };
          fallbackImg.src = reader.result as string;
        };
        reader.onerror = () => {
          reject(new Error('Failed to read photo from device storage.'));
        };
        reader.readAsDataURL(input);
      } else {
        reject(new Error('Image failed to load in browser.'));
      }
    };

    try {
      if (typeof input === 'string') {
        img.src = input;
      } else {
        objectUrl = URL.createObjectURL(input);
        img.src = objectUrl;
      }
    } catch (e) {
      cleanup();
      reject(e);
    }
  });
}
