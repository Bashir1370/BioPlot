/** Build a small transparent preview from the exact sanitized published SVG. */
export function thumbnailDimensions(width: number, height: number, maxSide = 192) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('Invalid image dimensions');
  const scale = Math.min(1, maxSide / width, maxSide / height);
  return {width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale))};
}

export async function createAssetThumbnail(svg: string): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}));
  try {
    return await new Promise<Blob>((resolve, reject) => {
      let finished = false;
      const finish = (blob?: Blob, error?: Error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (blob) resolve(blob); else reject(error ?? new Error('Preview encoding failed'));
      };
      const timer = setTimeout(() => finish(undefined, new Error('Preview generation timed out')), 5_000);
      const image = new Image();
      image.onerror = () => finish(undefined, new Error('Preview image could not be decoded'));
      image.onload = () => {
        if (finished) return;
        try {
          const size = thumbnailDimensions(image.naturalWidth, image.naturalHeight);
          const canvas = document.createElement('canvas');
          canvas.width = size.width; canvas.height = size.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas is unavailable');
          context.drawImage(image, 0, 0, size.width, size.height);
          canvas.toBlob(blob => finish(blob ?? undefined), 'image/webp', .82);
        } catch (error) { finish(undefined, error instanceof Error ? error : new Error('Preview generation failed')); }
      };
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}
