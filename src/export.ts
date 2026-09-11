import { activePage, AssetObject, BioPlotDocument, BioPlotObject, ContainerObject, ImageObject, LabelObject, PlotObject, ShapeObject, TextObject } from './model';
import { plotToSvg } from './plots';

const esc = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] ?? char));
const dash = (style?: 'solid' | 'dashed' | 'dotted') => style === 'dashed' ? ' stroke-dasharray="9 6"' : style === 'dotted' ? ' stroke-dasharray="2 6" stroke-linecap="round"' : '';

function transform(object: BioPlotObject) {
  return `translate(${object.x} ${object.y}) rotate(${object.rotation} ${object.width / 2} ${object.height / 2})`;
}

function stripOuterSvg(svg: string) {
  return svg.replace(/^\s*<\?xml[^>]*>\s*/i, '').replace(/^\s*<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '');
}

function viewBox(svg: string, fallbackWidth: number, fallbackHeight: number) {
  const match = svg.match(/viewBox=["']([^"']+)["']/i);
  return match?.[1] ?? `0 0 ${fallbackWidth} ${fallbackHeight}`;
}

function renderText(object: TextObject) {
  const anchor = object.align === 'left' ? 'start' : object.align === 'right' ? 'end' : 'middle';
  const x = object.align === 'left' ? 0 : object.align === 'right' ? object.width : object.width / 2;
  const y = object.height / 2 + object.fontSize * 0.35;
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter,Vazirmatn,Arial,sans-serif" font-size="${object.fontSize}" font-weight="${object.fontWeight}" font-style="${object.fontStyle ?? 'normal'}" fill="${object.color}">${esc(object.text)}</text></g>`;
}

function renderLabel(object: LabelObject) {
  const anchor = object.align === 'left' ? 'start' : object.align === 'right' ? 'end' : 'middle';
  const x = object.align === 'left' ? 9 : object.align === 'right' ? object.width - 9 : object.width / 2;
  const y = object.height / 2 + object.fontSize * .34;
  const radius = object.variant === 'panel' ? 9 : 8;
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><rect width="${object.width}" height="${object.height}" rx="${radius}" fill="${object.background}" stroke="${object.borderColor}"/><text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter,Vazirmatn,Arial,sans-serif" font-size="${object.fontSize}" font-weight="${object.fontWeight}" fill="${object.color}">${esc(object.text)}</text></g>`;
}

function renderShape(object: ShapeObject) {
  const common = `fill="${object.fill}" stroke="${object.stroke}" stroke-width="${object.strokeWidth}"${dash(object.lineStyle)}`;
  const shape = object.shape === 'ellipse'
    ? `<ellipse cx="${object.width / 2}" cy="${object.height / 2}" rx="${object.width / 2}" ry="${object.height / 2}" ${common}/>`
    : `<rect width="${object.width}" height="${object.height}" rx="${object.radius}" ${common}/>`;
  return `<g transform="${transform(object)}" opacity="${object.opacity}">${shape}</g>`;
}

function markerAttrs(head: 'end' | 'both' | 'none' | 'inhibition') {
  if (head === 'none') return '';
  if (head === 'inhibition') return ' marker-end="url(#bp-inhibit-end)"';
  return `${head === 'both' ? ' marker-start="url(#bp-arrow-start)"' : ''} marker-end="url(#bp-arrow-end)"`;
}

function renderArrow(object: Extract<BioPlotObject, { type: 'arrow' }>) {
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><line x1="4" y1="${object.height / 2}" x2="${object.width - 8}" y2="${object.height / 2}" stroke="${object.stroke}" stroke-width="${object.strokeWidth}"${dash(object.lineStyle)}${markerAttrs(object.arrowHead)}/></g>`;
}

function connectorPath(object: Extract<BioPlotObject, { type: 'connector' }>) {
  const midY = object.height / 2;
  if (object.route === 'elbow') return `M4 ${midY} H${object.width / 2} V${Math.max(8, object.height - 8)} H${object.width - 8}`;
  if (object.route === 'curved') return `M4 ${midY} C${object.width * .3} 2 ${object.width * .7} ${object.height - 2} ${object.width - 8} ${midY}`;
  return `M4 ${midY} H${object.width - 8}`;
}

function renderConnector(object: Extract<BioPlotObject, { type: 'connector' }>) {
  const label = object.label ? `<text x="${object.width / 2}" y="${Math.max(12, object.height / 2 - 8)}" text-anchor="middle" font-family="Inter,Vazirmatn,Arial,sans-serif" font-size="11" fill="#526e7a">${esc(object.label)}</text>` : '';
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><path d="${connectorPath(object)}" fill="none" stroke="${object.stroke}" stroke-width="${object.strokeWidth}"${dash(object.lineStyle)}${markerAttrs(object.arrowHead)}/>${label}</g>`;
}

function renderAsset(object: AssetObject) {
  const vb = viewBox(object.svg, object.width, object.height);
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><svg width="${object.width}" height="${object.height}" viewBox="${esc(vb)}" preserveAspectRatio="xMidYMid meet">${stripOuterSvg(object.svg)}</svg></g>`;
}

function renderImage(object: ImageObject) {
  const preserve = object.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><image href="${esc(object.src)}" width="${object.width}" height="${object.height}" preserveAspectRatio="${preserve}"/></g>`;
}

function renderContainer(object: ContainerObject) {
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><rect width="${object.width}" height="${object.height}" rx="${object.radius}" fill="${object.fill}" stroke="${object.stroke}" stroke-width="${object.strokeWidth}"/></g>`;
}

function renderPlot(object: PlotObject) {
  return `<g transform="${transform(object)}" opacity="${object.opacity}">${plotToSvg(object.spec, object.width, object.height)}</g>`;
}

export function objectToSvg(object: BioPlotObject) {
  if (object.hidden) return '';
  switch (object.type) {
    case 'text': return renderText(object);
    case 'label': return renderLabel(object);
    case 'shape': return renderShape(object);
    case 'arrow': return renderArrow(object);
    case 'connector': return renderConnector(object);
    case 'asset': return renderAsset(object);
    case 'image': return renderImage(object);
    case 'container': return renderContainer(object);
    case 'plot': return renderPlot(object);
  }
}

export function documentToSvg(bioDocument: BioPlotDocument) {
  const page = activePage(bioDocument);
  const objects = page.objects.map(objectToSvg).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}"><defs><marker id="bp-arrow-end" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="context-stroke"/></marker><marker id="bp-arrow-start" markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse"><path d="M8 0L0 4L8 8Z" fill="context-stroke"/></marker><marker id="bp-inhibit-end" markerWidth="8" markerHeight="12" refX="7" refY="6" orient="auto"><path d="M7 1V11" stroke="context-stroke" stroke-width="2"/></marker></defs><rect width="100%" height="100%" fill="${page.background}"/>${objects}</svg>`;
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
