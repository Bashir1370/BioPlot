import { memo } from 'react';

const objectUrlCache = new Map<string, string>();
const MAX_OBJECT_URLS = 400;

function getSvgObjectUrl(cacheKey: string, svg: string) {
  const key = `${cacheKey}:${svg.length}`;
  const existing = objectUrlCache.get(key);
  if (existing) return existing;

  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  objectUrlCache.set(key, url);

  // Keep the cache bounded for very large admin libraries.
  while (objectUrlCache.size > MAX_OBJECT_URLS) {
    const oldest = objectUrlCache.entries().next().value as [string, string] | undefined;
    if (!oldest) break;
    objectUrlCache.delete(oldest[0]);
    URL.revokeObjectURL(oldest[1]);
  }

  return url;
}

type Props = {
  svg: string;
  cacheKey: string;
  alt?: string;
  className?: string;
  eager?: boolean;
};

/**
 * Render library SVGs as browser images instead of injecting every SVG DOM tree
 * into React. Decoding is asynchronous and off-screen cards stay lazy, which is
 * especially important for SVG wrappers containing base64 PNG/JPEG/WebP data.
 */
export const AssetPreviewImage = memo(function AssetPreviewImage({
  svg,
  cacheKey,
  alt = '',
  className,
  eager = false,
}: Props) {
  const src = getSvgObjectUrl(cacheKey, svg);
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none',
      }}
    />
  );
});
