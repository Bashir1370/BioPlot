export function homeHeroThumbnailDimensions(width: number, height: number, maxSide = 640) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid image dimensions');
  }
  const scale = Math.min(1, maxSide / width, maxSide / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function createHomeHeroThumbnail(file: File, maxSide = 640): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<Blob>((resolve, reject) => {
      let settled = false;
      const finish = (blob?: Blob, error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (blob) resolve(blob);
        else reject(error ?? new Error('Home image thumbnail encoding failed'));
      };
      const timer = setTimeout(() => finish(undefined, new Error('Home image thumbnail timed out')), 8_000);
      const image = new Image();
      image.onerror = () => finish(undefined, new Error('Home image could not be decoded'));
      image.onload = () => {
        if (settled) return;
        try {
          const size = homeHeroThumbnailDimensions(image.naturalWidth, image.naturalHeight, maxSide);
          const canvas = document.createElement('canvas');
          canvas.width = size.width;
          canvas.height = size.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas is unavailable');
          context.drawImage(image, 0, 0, size.width, size.height);
          canvas.toBlob(blob => finish(blob ?? undefined), 'image/webp', 0.8);
        } catch (error) {
          finish(undefined, error instanceof Error ? error : new Error('Home image thumbnail encoding failed'));
        }
      };
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
