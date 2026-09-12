const ALPHA_THRESHOLD = 8;
const PADDING_PX = 1;

type PixelBounds = { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };

const boundsCache = new Map<string, Promise<PixelBounds | null>>();
let installed = false;

function readImageBounds(src: string): Promise<PixelBounds | null> {
  const cached = boundsCache.get(src);
  if (cached) return cached;

  const job = new Promise<PixelBounds | null>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (!width || !height) { resolve(null); return; }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) { resolve(null); return; }

      try {
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const data = context.getImageData(0, 0, width, height).data;
        let minX = width, minY = height, maxX = -1, maxY = -1;

        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha <= ALPHA_THRESHOLD) continue;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }

        if (maxX < minX || maxY < minY) { resolve(null); return; }
        minX = Math.max(0, minX - PADDING_PX);
        minY = Math.max(0, minY - PADDING_PX);
        maxX = Math.min(width - 1, maxX + PADDING_PX);
        maxY = Math.min(height - 1, maxY + PADDING_PX);
        resolve({ minX, minY, maxX, maxY, width, height });
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });

  boundsCache.set(src, job);
  return job;
}

function numericAttribute(element: Element, name: string, fallback: number) {
  const value = Number.parseFloat(element.getAttribute(name) ?? '');
  return Number.isFinite(value) ? value : fallback;
}

function parseViewBox(svg: SVGSVGElement, fallbackWidth: number, fallbackHeight: number) {
  const raw = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number) ?? [];
  if (raw.length === 4 && raw.every(Number.isFinite) && raw[2] > 0 && raw[3] > 0) {
    return { x: raw[0], y: raw[1], width: raw[2], height: raw[3] };
  }
  return { x: 0, y: 0, width: numericAttribute(svg, 'width', fallbackWidth), height: numericAttribute(svg, 'height', fallbackHeight) };
}

function setTightStyle(selection: HTMLElement, left: number, top: number, width: number, height: number) {
  const values = {
    '--bioplot-tight-left': `${left}px`,
    '--bioplot-tight-top': `${top}px`,
    '--bioplot-tight-width': `${width}px`,
    '--bioplot-tight-height': `${height}px`,
  } as const;
  for (const [key, value] of Object.entries(values)) {
    if (selection.style.getPropertyValue(key) !== value) selection.style.setProperty(key, value);
  }
  selection.classList.add('studio-selection-tight');
}

function clearTightStyle(selection: HTMLElement | null) {
  if (!selection) return;
  selection.classList.remove('studio-selection-tight');
  ['--bioplot-tight-left', '--bioplot-tight-top', '--bioplot-tight-width', '--bioplot-tight-height'].forEach(key => selection.style.removeProperty(key));
}

async function updateTightSelection() {
  const artboard = document.querySelector<HTMLElement>('.studio-artboard');
  const selection = artboard?.querySelector<HTMLElement>('.studio-selection') ?? null;
  if (!artboard || !selection) return;

  const selected = [...artboard.querySelectorAll<HTMLElement>('.studio-object.is-selected')];
  if (selected.length !== 1 || !selected[0].classList.contains('studio-asset')) {
    clearTightStyle(selection);
    return;
  }

  const object = selected[0];
  const rotationMatch = object.style.transform.match(/rotate\(([-+\d.]+)deg\)/);
  const rotation = rotationMatch ? Number(rotationMatch[1]) : 0;
  if (Math.abs(rotation) > 0.01) {
    clearTightStyle(selection);
    return;
  }

  const svg = object.querySelector<SVGSVGElement>('.studio-asset-visual svg');
  const imageNode = svg?.querySelector<SVGImageElement>('image');
  if (!svg || !imageNode) {
    clearTightStyle(selection);
    return;
  }

  const href = imageNode.getAttribute('href') ?? imageNode.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? '';
  if (!/^data:image\/(?:png|webp|jpe?g);base64,/i.test(href)) {
    clearTightStyle(selection);
    return;
  }

  const pixel = await readImageBounds(href);
  if (!pixel || !object.isConnected || !selection.isConnected || !object.classList.contains('is-selected')) return;

  const boxLeft = Number.parseFloat(object.style.left || '0');
  const boxTop = Number.parseFloat(object.style.top || '0');
  const boxWidth = Number.parseFloat(object.style.width || '0');
  const boxHeight = Number.parseFloat(object.style.height || '0');
  if (!(boxWidth > 0 && boxHeight > 0)) return;

  const viewBox = parseViewBox(svg, pixel.width, pixel.height);
  const imageX = numericAttribute(imageNode, 'x', 0);
  const imageY = numericAttribute(imageNode, 'y', 0);
  const imageWidth = numericAttribute(imageNode, 'width', pixel.width);
  const imageHeight = numericAttribute(imageNode, 'height', pixel.height);

  const cropX = imageX + (pixel.minX / pixel.width) * imageWidth;
  const cropY = imageY + (pixel.minY / pixel.height) * imageHeight;
  const cropRight = imageX + ((pixel.maxX + 1) / pixel.width) * imageWidth;
  const cropBottom = imageY + ((pixel.maxY + 1) / pixel.height) * imageHeight;

  const fx = Math.max(0, Math.min(1, (cropX - viewBox.x) / viewBox.width));
  const fy = Math.max(0, Math.min(1, (cropY - viewBox.y) / viewBox.height));
  const fr = Math.max(0, Math.min(1, (cropRight - viewBox.x) / viewBox.width));
  const fb = Math.max(0, Math.min(1, (cropBottom - viewBox.y) / viewBox.height));
  const fw = fr - fx;
  const fh = fb - fy;

  if (fw <= 0 || fh <= 0 || (fw > 0.985 && fh > 0.985)) {
    clearTightStyle(selection);
    return;
  }

  setTightStyle(selection, boxLeft + boxWidth * fx, boxTop + boxHeight * fy, boxWidth * fw, boxHeight * fh);
}

export function installTightAssetSelection() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { void updateTightSelection(); });
  };

  const observer = new MutationObserver(records => {
    if (records.some(record => {
      const target = record.target instanceof Element ? record.target : null;
      return Boolean(target?.closest('.studio-object') || target?.classList.contains('studio-object'));
    })) schedule();
  });

  const start = () => {
    const artboard = document.querySelector('.studio-artboard');
    if (!artboard) { requestAnimationFrame(start); return; }
    observer.observe(artboard, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    schedule();
  };

  document.addEventListener('pointerup', schedule, true);
  document.addEventListener('click', schedule, true);
  window.addEventListener('resize', schedule);
  start();
}
