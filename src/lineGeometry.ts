import { makeId, type ArrowObject, type LineCap, type LineStyle } from './model';

export type LinePoint = { x: number; y: number };
export type DrawLineSettings = {
  stroke: string;
  strokeWidth: number;
  lineStyle: LineStyle;
  startHead: LineCap;
  endHead: LineCap;
  axis?: 'horizontal' | 'vertical';
};

const safe = (n: number) => Number.isFinite(n) ? n : 0;
const fmt = (n: number) => Number(safe(n).toFixed(3));

/** The endpoints are relative to the object's bounds: moving and resizing the object keeps them attached. */
export function createDrawnLine(start: LinePoint, end: LinePoint, settings: DrawLineSettings): ArrowObject {
  const thickness = Math.max(0.5, Math.min(40, safe(settings.strokeWidth) || 2));
  const margin = Math.max(14, thickness * 2.5);
  const x = Math.min(start.x, end.x) - margin;
  const y = Math.min(start.y, end.y) - margin;
  const width = Math.abs(end.x - start.x) + margin * 2;
  const height = Math.abs(end.y - start.y) + margin * 2;
  return {
    id: makeId('line'), type: 'arrow', name: 'Editable line', x, y, width, height,
    rotation: 0, opacity: 1, stroke: settings.stroke, strokeWidth: thickness,
    lineStyle: settings.lineStyle, arrowHead: settings.endHead === 'none' ? 'none' : 'end',
    startHead: settings.startHead, endHead: settings.endHead,
    startPoint: { x: (start.x - x) / width, y: (start.y - y) / height },
    endPoint: { x: (end.x - x) / width, y: (end.y - y) / height },
  };
}

export function worldEndpoints(line: ArrowObject): { start: LinePoint; end: LinePoint } {
  const start = line.startPoint ?? { x: 4 / line.width, y: 0.5 };
  const end = line.endPoint ?? { x: (line.width - 9) / line.width, y: 0.5 };
  return {
    start: { x: line.x + start.x * line.width, y: line.y + start.y * line.height },
    end: { x: line.x + end.x * line.width, y: line.y + end.y * line.height },
  };
}

export function updateLineEndpoint(line: ArrowObject, which: 'start' | 'end', point: LinePoint): ArrowObject {
  const previous = worldEndpoints(line);
  const next = createDrawnLine(which === 'start' ? point : previous.start, which === 'end' ? point : previous.end, {
    stroke: line.stroke, strokeWidth: line.strokeWidth, lineStyle: line.lineStyle ?? 'solid',
    startHead: line.startHead ?? (line.arrowHead === 'both' ? 'arrow' : 'none'),
    endHead: line.endHead ?? (line.arrowHead === 'none' ? 'none' : 'arrow'),
  });
  return { ...line, x: next.x, y: next.y, width: next.width, height: next.height,
    startPoint: next.startPoint, endPoint: next.endPoint };
}

/** SVG markup shared by the on-screen renderer and SVG/PNG export. */
export function lineSvgBody(line: ArrowObject): string {
  const start = line.startPoint ?? { x: 4 / line.width, y: 0.5 };
  const end = line.endPoint ?? { x: (line.width - 9) / line.width, y: 0.5 };
  const x1 = safe(start.x * line.width), y1 = safe(start.y * line.height);
  const x2 = safe(end.x * line.width), y2 = safe(end.y * line.height);
  const dx = x2 - x1, dy = y2 - y1, length = Math.max(0.001, Math.hypot(dx, dy));
  const ux = dx / length, uy = dy / length;
  const stroke = /^#[0-9a-f]{6}$/i.test(line.stroke) ? line.stroke : '#087f79';
  const width = Math.max(0.5, Math.min(40, safe(line.strokeWidth) || 2));
  const dash = line.lineStyle === 'dashed' ? ' stroke-dasharray="9 6"' : line.lineStyle === 'dotted' ? ' stroke-dasharray="2 6"' : '';
  const startHead = line.startHead ?? (line.arrowHead === 'both' ? 'arrow' : 'none');
  const endHead = line.endHead ?? (line.arrowHead === 'none' ? 'none' : 'arrow');
  const head = (kind: LineCap, x: number, y: number, sign: number) => {
    if (kind === 'none') return '';
    const size = Math.max(8, width * 3.2);
    const bx = x + ux * size * sign, by = y + uy * size * sign;
    const nx = -uy, ny = ux;
    const p = (px: number, py: number) => `${fmt(px)},${fmt(py)}`;
    if (kind === 'circle') return `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(size * .43)}" fill="white" stroke="${stroke}" stroke-width="${width}"/>`;
    if (kind === 'bar') return `<path d="M${p(x+nx*size*.65,y+ny*size*.65)}L${p(x-nx*size*.65,y-ny*size*.65)}" stroke="${stroke}" stroke-width="${width}"/>`;
    if (kind === 'diamond') return `<path d="M${p(x,y)}L${p(bx+nx*size*.4,by+ny*size*.4)}L${p(x+ux*size*sign*2,y+uy*size*sign*2)}L${p(bx-nx*size*.4,by-ny*size*.4)}Z" fill="${stroke}"/>`;
    return `<path d="M${p(x,y)}L${p(bx+nx*size*.45,by+ny*size*.45)}L${p(bx-nx*size*.45,by-ny*size*.45)}Z" fill="${stroke}"/>`;
  };
  return `<path d="M${fmt(x1)} ${fmt(y1)}L${fmt(x2)} ${fmt(y2)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"${dash}/>${head(startHead,x1,y1,1)}${head(endHead,x2,y2,-1)}`;
}
