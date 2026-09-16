import { makeId, type ArrowObject, type LineCap, type LineStyle } from './model';

export type LinePoint = { x: number; y: number };
export type PathMode = 'straight' | 'polyline' | 'curved';
export type DrawLineSettings = {
  stroke: string; strokeWidth: number; lineStyle: LineStyle;
  startHead: LineCap; endHead: LineCap;
  pathMode?: PathMode; presetId?: string;
  axis?: 'horizontal' | 'vertical';
};
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
const fmt = (n: number) => Number((Number.isFinite(n) ? n : 0).toFixed(3));
const caps: LineCap[] = ['none', 'arrow', 'circle', 'bar', 'diamond'];
const modes: PathMode[] = ['straight', 'polyline', 'curved'];
const styles: LineStyle[] = ['solid', 'dashed', 'dotted'];
const safeColor = (s: string) => /^#[0-9a-f]{6}$/i.test(s) ? s : '#087f79';

/** Keep normalized nodes inside a padded object box so resizing scales geometry and caps together. */
export function lineFromWorldNodes(points: LinePoint[], settings: DrawLineSettings, previous?: ArrowObject): ArrowObject {
  if (points.length < 2 || points.length > 80 || points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) throw new Error('Invalid line points');
  const strokeWidth = clamp(settings.strokeWidth, .5, 40);
  const margin = Math.max(14, strokeWidth * 3);
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
  const x = minX - margin, y = minY - margin;
  const width = maxX - minX + 2 * margin, height = maxY - minY + 2 * margin;
  const nodes = points.map(p => ({ x: (p.x - x) / width, y: (p.y - y) / height }));
  const startHead = settings.startHead, endHead = settings.endHead;
  return {
    ...(previous ?? {}), id: previous?.id ?? makeId('line'), type: 'arrow',
    name: previous?.name ?? 'Editable line', x, y, width, height,
    // Editing a rotated path bakes the visible coordinates into its nodes.
    rotation: 0, opacity: previous?.opacity ?? 1, stroke: safeColor(settings.stroke), strokeWidth,
    lineStyle: settings.lineStyle, arrowHead: endHead === 'none' ? 'none' : startHead === 'arrow' && endHead === 'arrow' ? 'both' : 'end',
    startHead, endHead, pathMode: settings.pathMode ?? 'straight', nodes,
    startPoint: nodes[0], endPoint: nodes[nodes.length - 1],
    dashLength: previous?.dashLength,
  };
}

function initialPoints(start: LinePoint, end: LinePoint, settings: DrawLineSettings): LinePoint[] {
  const vx = end.x - start.x, vy = end.y - start.y;
  const len = Math.max(1, Math.hypot(vx, vy));
  const normal = { x: -vy / len, y: vx / len };
  const amplitude = clamp(len * .23, 18, 72);
  const along = (t: number, offset = 0): LinePoint => ({ x: start.x + vx * t + normal.x * offset, y: start.y + vy * t + normal.y * offset });
  switch (settings.presetId) {
    case 'curved': case 'arc': return [start, along(.5, -amplitude), end];
    case 's-curve': return [start, along(.33, -amplitude), along(.67, amplitude), end];
    case 'wave': return [start, along(.25, -amplitude), along(.5, amplitude), along(.75, -amplitude), end];
    case 'zigzag': return [start, along(.25, -amplitude), along(.5, amplitude), along(.75, -amplitude), end];
    case 'elbow': return [start, { x: start.x + vx * .5, y: start.y }, { x: start.x + vx * .5, y: end.y }, end];
    case 'bracket': return [start, { x: start.x + vx * .15, y: start.y }, { x: start.x + vx * .15, y: end.y }, end];
    default: return [start, end];
  }
}

export function createDrawnLine(start: LinePoint, end: LinePoint, settings: DrawLineSettings): ArrowObject {
  const curved = ['curved', 'arc', 's-curve', 'wave'].includes(settings.presetId ?? '');
  const polygon = ['zigzag', 'elbow', 'bracket'].includes(settings.presetId ?? '');
  return lineFromWorldNodes(initialPoints(start, end, settings), {
    ...settings, pathMode: settings.pathMode ?? (curved ? 'curved' : polygon ? 'polyline' : 'straight'),
  });
}

/** World coordinates account for rotation of the entire object. */
export function worldLineNodes(line: ArrowObject): LinePoint[] {
  const points = line.nodes?.length && line.nodes.length >= 2 ? line.nodes : [line.startPoint ?? { x: 4 / line.width, y: .5 }, line.endPoint ?? { x: (line.width - 9) / line.width, y: .5 }];
  const a = line.rotation * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
  const cx = line.width / 2, cy = line.height / 2;
  return points.map(p => {
    const x = p.x * line.width - cx, y = p.y * line.height - cy;
    return { x: line.x + cx + x * cos - y * sin, y: line.y + cy + x * sin + y * cos };
  });
}
export function worldEndpoints(line: ArrowObject) { const n = worldLineNodes(line); return { start: n[0], end: n[n.length - 1] }; }
function settingsOf(line: ArrowObject): DrawLineSettings {
  return { stroke: line.stroke, strokeWidth: line.strokeWidth, lineStyle: line.lineStyle ?? 'solid',
    startHead: line.startHead ?? (line.arrowHead === 'both' ? 'arrow' : 'none'),
    endHead: line.endHead ?? (line.arrowHead === 'none' ? 'none' : 'arrow'), pathMode: line.pathMode ?? 'straight' };
}
export function updateLineNode(line: ArrowObject, index: number, point: LinePoint): ArrowObject {
  const nodes = worldLineNodes(line);
  if (index < 0 || index >= nodes.length) return line;
  nodes[index] = point;
  return lineFromWorldNodes(nodes, settingsOf(line), line);
}
export function updateLineEndpoint(line: ArrowObject, which: 'start' | 'end', point: LinePoint): ArrowObject {
  return updateLineNode(line, which === 'start' ? 0 : worldLineNodes(line).length - 1, point);
}
export function insertLineNode(line: ArrowObject, segmentIndex: number): ArrowObject {
  const points = worldLineNodes(line);
  if (points.length >= 80 || segmentIndex < 0 || segmentIndex >= points.length - 1) return line;
  const a = points[segmentIndex], b = points[segmentIndex + 1];
  points.splice(segmentIndex + 1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  return lineFromWorldNodes(points, { ...settingsOf(line), pathMode: line.pathMode === 'curved' ? 'curved' : 'polyline' }, line);
}
export function removeLineNode(line: ArrowObject, index: number): ArrowObject {
  const points = worldLineNodes(line);
  if (index <= 0 || index >= points.length - 1) return line;
  points.splice(index, 1);
  return lineFromWorldNodes(points, settingsOf(line), line);
}

function pathData(points: LinePoint[], mode: PathMode): string {
  const p = (point: LinePoint) => `${fmt(point.x)} ${fmt(point.y)}`;
  let result = `M${p(points[0])}`;
  if (mode !== 'curved' || points.length < 3) return result + points.slice(1).map(point => `L${p(point)}`).join('');
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)];
    const c1 = { x: b.x + (c.x - a.x) / 6, y: b.y + (c.y - a.y) / 6 };
    const c2 = { x: c.x - (d.x - b.x) / 6, y: c.y - (d.y - b.y) / 6 };
    result += `C${p(c1)} ${p(c2)} ${p(c)}`;
  }
  return result;
}

/** Shared SVG markup for live editor and both SVG/PNG export. Never interpolate unvalidated SVG or URLs. */
export function lineSvgBody(line: ArrowObject): string {
  const normalized = line.nodes?.length && line.nodes.length >= 2 ? line.nodes : [line.startPoint ?? { x: 4 / line.width, y: .5 }, line.endPoint ?? { x: (line.width - 9) / line.width, y: .5 }];
  const pts = normalized.map(p => ({ x: p.x * line.width, y: p.y * line.height }));
  const first = pts[0], last = pts[pts.length - 1];
  const stroke = safeColor(line.stroke), width = clamp(line.strokeWidth, .5, 40);
  const dashLen = clamp(line.dashLength ?? 9, 1, 80);
  const dash = line.lineStyle === 'dashed' ? ` stroke-dasharray="${dashLen} ${fmt(dashLen * .7)}"` : line.lineStyle === 'dotted' ? ` stroke-dasharray="${fmt(Math.max(1, width * .5))} ${dashLen}"` : '';
  const startHead = line.startHead ?? (line.arrowHead === 'both' ? 'arrow' : 'none');
  const endHead = line.endHead ?? (line.arrowHead === 'none' ? 'none' : 'arrow');
  const cap = (kind: LineCap, at: LinePoint, neighbor: LinePoint) => {
    if (kind === 'none') return '';
    const dx = neighbor.x - at.x, dy = neighbor.y - at.y, length = Math.max(.001, Math.hypot(dx, dy));
    const ux = dx / length, uy = dy / length, nx = -uy, ny = ux;
    const size = Math.max(8, width * 3.2), p = (x: number, y: number) => `${fmt(x)},${fmt(y)}`;
    const bx = at.x + ux * size, by = at.y + uy * size;
    if (kind === 'circle') return `<circle cx="${fmt(at.x)}" cy="${fmt(at.y)}" r="${fmt(size * .43)}" fill="white" stroke="${stroke}" stroke-width="${width}"/>`;
    if (kind === 'bar') return `<path d="M${p(at.x+nx*size*.65,at.y+ny*size*.65)}L${p(at.x-nx*size*.65,at.y-ny*size*.65)}" stroke="${stroke}" stroke-width="${width}"/>`;
    if (kind === 'diamond') return `<path d="M${p(at.x,at.y)}L${p(bx+nx*size*.4,by+ny*size*.4)}L${p(at.x+ux*size*2,at.y+uy*size*2)}L${p(bx-nx*size*.4,by-ny*size*.4)}Z" fill="${stroke}"/>`;
    return `<path d="M${p(at.x,at.y)}L${p(bx+nx*size*.45,by+ny*size*.45)}L${p(bx-nx*size*.45,by-ny*size*.45)}Z" fill="${stroke}"/>`;
  };
  const mode = modes.includes(line.pathMode ?? 'straight') ? line.pathMode ?? 'straight' : 'straight';
  const geometry = pathData(pts, mode);
  return `<path d="${geometry}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash}/>${cap(startHead,first,pts[1])}${cap(endHead,last,pts[pts.length-2])}`;
}

/** Admin-authored native presets carry validated settings in inert SVG attributes. */
export function nativePresetSvg(settings: DrawLineSettings): string {
  const id = settings.presetId ?? 'straight';
  const permitted = ['straight','arrow','horizontal','vertical','dashed','dotted','double','activation','inhibition','curved','arc','s-curve','wave','zigzag','elbow','bracket','dimension'];
  const presetId = permitted.includes(id) ? id : 'straight';
  const stroke = safeColor(settings.stroke), width = clamp(settings.strokeWidth, .5, 40);
  const start = caps.includes(settings.startHead) ? settings.startHead : 'none';
  const end = caps.includes(settings.endHead) ? settings.endHead : 'arrow';
  const mode = modes.includes(settings.pathMode ?? 'straight') ? settings.pathMode ?? 'straight' : 'straight';
  const asset = createDrawnLine({x:24,y:75},{x:276,y:75},{...settings,presetId});
  const translate = `translate(${fmt(asset.x)} ${fmt(asset.y)})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150" data-bioplot-native="line" data-bioplot-preset="${presetId}" data-bioplot-mode="${mode}" data-bioplot-start="${start}" data-bioplot-end="${end}" data-bioplot-color="${stroke}" data-bioplot-width="${width}" data-bioplot-style="${styles.includes(settings.lineStyle)?settings.lineStyle:'solid'}"><g transform="${translate}">${lineSvgBody(asset)}</g></svg>`;
}
export function parseNativeLinePreset(svg: string): DrawLineSettings | null {
  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = parsed.documentElement;
  if (root.localName !== 'svg' || root.getAttribute('data-bioplot-native') !== 'line') return null;
  const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T) => value && allowed.includes(value as T) ? value as T : fallback;
  const presetId = root.getAttribute('data-bioplot-preset') ?? 'straight';
  const mode = pick(root.getAttribute('data-bioplot-mode'), modes, 'straight');
  const style = pick(root.getAttribute('data-bioplot-style'), styles, 'solid');
  return { stroke: safeColor(root.getAttribute('data-bioplot-color') ?? ''), strokeWidth: clamp(Number(root.getAttribute('data-bioplot-width')), .5, 40),
    lineStyle: style, startHead: pick(root.getAttribute('data-bioplot-start'),caps,'none'), endHead: pick(root.getAttribute('data-bioplot-end'),caps,'arrow'),
    pathMode: mode, presetId: /^[a-z-]{1,30}$/.test(presetId) ? presetId : 'straight' };
}
