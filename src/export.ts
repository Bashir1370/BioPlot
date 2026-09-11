import { activePage, AssetObject, BioPlotDocument, BioPlotObject, PlotObject, ShapeObject, TextObject } from './model';
import { plotToSvg } from './plots';

const esc = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] ?? char));

function transform(object: BioPlotObject) {
  return `translate(${object.x} ${object.y}) rotate(${object.rotation} ${object.width / 2} ${object.height / 2})`;
}

function stripOuterSvg(svg: string) {
  return svg
    .replace(/^\s*<\?xml[^>]*>\s*/i, '')
    .replace(/^\s*<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '');
}

function viewBox(svg: string, fallbackWidth: number, fallbackHeight: number) {
  const match = svg.match(/viewBox=["']([^"']+)["']/i);
  return match?.[1] ?? `0 0 ${fallbackWidth} ${fallbackHeight}`;
}

function renderText(object: TextObject) {
  const anchor = object.align === 'left' ? 'start' : object.align === 'right' ? 'end' : 'middle';
  const x = object.align === 'left' ? 0 : object.align === 'right' ? object.width : object.width / 2;
  const y = object.height / 2 + object.fontSize * 0.35;
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter,Vazirmatn,Arial,sans-serif" font-size="${object.fontSize}" font-weight="${object.fontWeight}" fill="${object.color}">${esc(object.text)}</text></g>`;
}

function renderShape(object: ShapeObject) {
  const common = `fill="${object.fill}" stroke="${object.stroke}" stroke-width="${object.strokeWidth}"`;
  const shape = object.shape === 'ellipse'
    ? `<ellipse cx="${object.width / 2}" cy="${object.height / 2}" rx="${object.width / 2}" ry="${object.height / 2}" ${common}/>`
    : `<rect width="${object.width}" height="${object.height}" rx="${object.radius}" ${common}/>`;
  return `<g transform="${transform(object)}" opacity="${object.opacity}">${shape}</g>`;
}

function renderArrow(object: Extract<BioPlotObject, { type: 'arrow' }>) {
  const markerStart = object.arrowHead === 'both' ? ' marker-start="url(#bp-arrow-start)"' : '';
  const markerEnd = object.arrowHead === 'none' ? '' : ' marker-end="url(#bp-arrow-end)"';
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><line x1="4" y1="${object.height / 2}" x2="${object.width - 6}" y2="${object.height / 2}" stroke="${object.stroke}" stroke-width="${object.strokeWidth}" stroke-linecap="round"${markerStart}${markerEnd}/></g>`;
}

function renderAsset(object: AssetObject) {
  const vb = viewBox(object.svg, object.width, object.height);
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><svg width="${object.width}" height="${object.height}" viewBox="${esc(vb)}" preserveAspectRatio="xMidYMid meet">${stripOuterSvg(object.svg)}</svg></g>`;
}

function renderPlot(object: PlotObject) {
  return `<g transform="${transform(object)}" opacity="${object.opacity}">${plotToSvg(object.spec, object.width, object.height)}</g>`;
}

export function objectToSvg(object: BioPlotObject) {
  if (object.hidden) return '';
  switch (object.type) {
    case 'text': return renderText(object);
    case 'shape': return renderShape(object);
    case 'arrow': return renderArrow(object);
    case 'asset': return renderAsset(object);
    case 'plot': return renderPlot(object);
  }
}

export function documentToSvg(bioDocument: BioPlotDocument) {
  const page = activePage(bioDocument);
  const objects = page.objects.map(objectToSvg).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}"><defs><marker id="bp-arrow-end" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="context-stroke"/></marker><marker id="bp-arrow-start" markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse"><path d="M8 0L0 4L8 8Z" fill="context-stroke"/></marker></defs><rect width="100%" height="100%" fill="${page.background}"/>${objects}</svg>`;
}

const safeFileName = (title: string) => title.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'bioplot-figure';

export function downloadSvg(bioDocument: BioPlotDocument) {
  const blob = new Blob([documentToSvg(bioDocument)], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${safeFileName(bioDocument.title)}.svg`);
}

export async function downloadPng(bioDocument: BioPlotDocument, dpi = 300, widthMm = 160) {
  const page = activePage(bioDocument);
  const targetWidth = Math.max(1, Math.round((widthMm / 25.4) * dpi));
  const scale = targetWidth / page.width;
  const targetHeight = Math.round(page.height * scale);
  const svg = documentToSvg(bioDocument);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = await loadImage(url);
    const canvas = window.document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available.');
    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result: Blob | null) => result ? resolve(result) : reject(new Error('PNG export failed.')), 'image/png'));
    downloadBlob(blob, `${safeFileName(bioDocument.title)}-${dpi}dpi.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not render SVG for PNG export.'));
    image.src = url;
  });
}

function downloadBlob(blob: Blob, name: string) {
  const anchor = window.document.createElement('a');
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = name;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
