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
const caps: LineCap[] = ['none', 'arrow', 'open-arrow', 'slim-arrow', 'triangle', 'stealth', 'chevron', 'double-arrow', 'circle', 'filled-circle', 'bar', 'diamond', 'square'];
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
    case 'corner': return [start,along(0,-amplitude),along(1,-amplitude)];
    case 'rounded-elbow': return [start,along(.05,-amplitude*.7),along(.2,-amplitude),along(1,-amplitude)];
    case 'semicircle': return Array.from({length:13},(_,i)=>along((1-Math.cos(Math.PI*i/12))/2,-Math.sin(Math.PI*i/12)*len*.45));
    case 'circular': return Array.from({length:25},(_,i)=>{
      const angle=-Math.PI*.15+i/24*Math.PI*1.7;
      return along(.5+Math.cos(angle)*.45,Math.sin(angle)*len*.45);
    });
    case 'square-bracket': return [along(.2,-amplitude),along(0,-amplitude),along(0,amplitude),along(.2,amplitude)];
    case 'brace': return [along(.2,-amplitude),along(.05,-amplitude*.8),along(.05,-amplitude*.25),along(0),along(.05,amplitude*.25),along(.05,amplitude*.8),along(.2,amplitude)];

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
  const curved = ['curved', 'arc', 's-curve', 'wave', 'rounded-elbow', 'circular', 'semicircle', 'brace'].includes(settings.presetId ?? '');
  const polygon = ['zigzag', 'elbow', 'bracket', 'corner', 'square-bracket'].includes(settings.presetId ?? '');
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
  // The stored endpoints are the EXACT visible tips. The shaft is shortened
  // inside any closed marker, preventing its rounded stroke from protruding
  // beyond the arrow tip. Both renderer and exported SVG use this same body.
  const measure = (kind: LineCap, at: LinePoint, neighbor: LinePoint) => {
    const segment = Math.hypot(neighbor.x - at.x, neighbor.y - at.y);
    const large = kind === 'diamond' || kind === 'double-arrow';
    return Math.max(1, Math.min(Math.max(9, width * 3.2), segment * (large ? .22 : .34)));
  };
  const inset = (kind: LineCap, size: number) => {
    if (kind === 'arrow' || kind === 'slim-arrow' || kind === 'triangle' || kind === 'stealth') return size * .8;
    if (kind === 'double-arrow') return size * 1.7;
    if (kind === 'diamond') return size * 1.88;
    if (kind === 'circle' || kind === 'filled-circle') return size * .9;
    if (kind === 'square') return size * .92;
    return 0;
  };
  const towards = (at: LinePoint, neighbor: LinePoint, distance: number): LinePoint => {
    const length = Math.max(.001, Math.hypot(neighbor.x - at.x, neighbor.y - at.y));
    return { x: at.x + (neighbor.x - at.x) / length * distance,
             y: at.y + (neighbor.y - at.y) / length * distance };
  };
  const startSize = measure(startHead, first, pts[1]);
  const endSize = measure(endHead, last, pts[pts.length - 2]);
  const shaft = pts.map(point => ({ ...point }));
  shaft[0] = towards(first, pts[1], inset(startHead, startSize));
  shaft[shaft.length - 1] = towards(last, pts[pts.length - 2], inset(endHead, endSize));

  const cap = (kind: LineCap, at: LinePoint, neighbor: LinePoint, size: number): string => {
    if (kind === 'none') return '';
    const dx = neighbor.x - at.x, dy = neighbor.y - at.y;
    const length = Math.max(.001, Math.hypot(dx, dy));
    const ux = dx / length, uy = dy / length, nx = -uy, ny = ux;
    const point = (along: number, across = 0) =>
      `${fmt(at.x + ux * along + nx * across)},${fmt(at.y + uy * along + ny * across)}`;
    const tip = point(0);
    const fillPath = (d: string) => `<path d="${d}" fill="${stroke}"/>`;
    const v = (distance: number, spread: number) =>
      `M${point(distance, spread)}L${tip}L${point(distance, -spread)}`;
    switch (kind) {
      case 'arrow': return fillPath(`${v(size, size * .48)}Z`);
      case 'slim-arrow': return fillPath(`${v(size, size * .26)}Z`);
      case 'triangle': return fillPath(`${v(size, size * .73)}Z`);
      case 'stealth': return fillPath(`M${tip}L${point(size, size * .5)}L${point(size * .7)}L${point(size, -size * .5)}Z`);
      case 'open-arrow': return `<path d="${v(size, size * .48)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="miter" stroke-linecap="butt"/>`;
      case 'chevron': return `<path d="${v(size, size * .5)}M${point(size * 1.65, size * .5)}L${point(size * .65)}L${point(size * 1.65, -size * .5)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="miter" stroke-linecap="butt"/>`;
      case 'double-arrow': return fillPath(`${v(size, size * .43)}Z M${point(size * .8)}L${point(size * 1.8, size * .43)}L${point(size * 1.8, -size * .43)}Z`);
      case 'circle':
      case 'filled-circle': {
        const radius = size * .45;
        const center = towards(at, neighbor, radius);
        return `<circle cx="${fmt(center.x)}" cy="${fmt(center.y)}" r="${fmt(radius)}" fill="${kind === 'circle' ? 'white' : stroke}" stroke="${stroke}" stroke-width="${width}"/>`;
      }
      case 'bar': return `<path d="M${point(0,size * .62)}L${point(0,-size * .62)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="butt"/>`;
      case 'diamond': return fillPath(`M${tip}L${point(size, size * .48)}L${point(size * 2)}L${point(size,-size * .48)}Z`);
      case 'square': return fillPath(`M${point(0,size * .46)}L${point(size,size * .46)}L${point(size,-size * .46)}L${point(0,-size * .46)}Z`);
      default: return '';
    }
  };
  const mode = modes.includes(line.pathMode ?? 'straight') ? line.pathMode ?? 'straight' : 'straight';
  const geometry = pathData(shaft, mode);
  const flat = ['bar','open-arrow','chevron'].includes(startHead) || ['bar','open-arrow','chevron'].includes(endHead);
  return `<path d="${geometry}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="${flat ? 'butt' : 'round'}" stroke-linejoin="round"${dash}/>${cap(startHead,first,pts[1],startSize)}${cap(endHead,last,pts[pts.length-2],endSize)}`;
}

/** Preview uses the exact production marker geometry, mirrored at the two endpoints. */
export function lineCapPreviewSvg(kind: LineCap, side: 'start' | 'end'): string {
  const sample = createDrawnLine({x:14,y:24},{x:106,y:24},{
    stroke:'#153e4b',strokeWidth:3,lineStyle:'solid',
    startHead:side==='start'?kind:'none',endHead:side==='end'?kind:'none',
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 48" width="120" height="48" aria-hidden="true"><g transform="translate(${fmt(sample.x)} ${fmt(sample.y)})">${lineSvgBody(sample)}</g></svg>`;
}

/** Admin-authored native presets carry validated settings in inert SVG attributes. */
export function nativePresetSvg(settings: DrawLineSettings): string {
  const id = settings.presetId ?? 'straight';
  const permitted = ['straight','arrow','horizontal','vertical','dashed','dotted','double','activation','inhibition','curved','arc','s-curve','wave','zigzag','elbow','bracket','dimension','corner','rounded-elbow','semicircle','circular','square-bracket','brace'];
  const presetId = permitted.includes(id) ? id : 'straight';
  const stroke = safeColor(settings.stroke), width = clamp(settings.strokeWidth, .5, 40);
  const start = caps.includes(settings.startHead) ? settings.startHead : 'none';
  const end = caps.includes(settings.endHead) ? settings.endHead : 'arrow';
  const mode = modes.includes(settings.pathMode ?? 'straight') ? settings.pathMode ?? 'straight' : 'straight';
  const asset = createDrawnLine({x:24,y:75},{x:276,y:75},{...settings,presetId});
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(asset.width)} ${fmt(asset.height)}" data-bioplot-native="line" data-bioplot-preset="${presetId}" data-bioplot-mode="${mode}" data-bioplot-start="${start}" data-bioplot-end="${end}" data-bioplot-color="${stroke}" data-bioplot-width="${width}" data-bioplot-style="${styles.includes(settings.lineStyle)?settings.lineStyle:'solid'}">${lineSvgBody(asset)}</svg>`;
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
