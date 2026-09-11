import { activePage, BioPlotDocument, BioPlotObject, cloneDocument, ObjectId } from './model';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  cx: number;
  cy: number;
}

export type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionAxis = 'horizontal' | 'vertical';
export type ZOrderAction = 'front' | 'back' | 'forward' | 'backward';

const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function objectBounds(object: BioPlotObject): Bounds {
  const angle = radians(object.rotation);
  const c = Math.abs(Math.cos(angle));
  const s = Math.abs(Math.sin(angle));
  const width = object.width * c + object.height * s;
  const height = object.width * s + object.height * c;
  const cx = object.x + object.width / 2;
  const cy = object.y + object.height / 2;
  const x = cx - width / 2;
  const y = cy - height / 2;
  return { x, y, width, height, right: x + width, bottom: y + height, cx, cy };
}

export function selectionBounds(objects: BioPlotObject[]): Bounds | null {
  if (!objects.length) return null;
  const bounds = objects.map(objectBounds);
  const x = Math.min(...bounds.map(b => b.x));
  const y = Math.min(...bounds.map(b => b.y));
  const right = Math.max(...bounds.map(b => b.right));
  const bottom = Math.max(...bounds.map(b => b.bottom));
  return { x, y, width: right - x, height: bottom - y, right, bottom, cx: (x + right) / 2, cy: (y + bottom) / 2 };
}

export function rectFromPoints(ax: number, ay: number, bx: number, by: number): Bounds {
  const x = Math.min(ax, bx);
  const y = Math.min(ay, by);
  const right = Math.max(ax, bx);
  const bottom = Math.max(ay, by);
  return { x, y, right, bottom, width: right - x, height: bottom - y, cx: (x + right) / 2, cy: (y + bottom) / 2 };
}

export function boundsIntersect(a: Bounds, b: Bounds) {
  return a.x <= b.right && a.right >= b.x && a.y <= b.bottom && a.bottom >= b.y;
}

export function objectsInRect(objects: BioPlotObject[], rect: Bounds) {
  return objects.filter(object => !object.hidden && boundsIntersect(objectBounds(object), rect));
}

export function rotateObjects(objects: BioPlotObject[], delta: number, center?: { x: number; y: number }): BioPlotObject[] {
  const bounds = selectionBounds(objects);
  if (!bounds) return objects;
  const pivot = center ?? { x: bounds.cx, y: bounds.cy };
  const a = radians(delta);
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return objects.map(object => {
    const cx = object.x + object.width / 2;
    const cy = object.y + object.height / 2;
    const dx = cx - pivot.x;
    const dy = cy - pivot.y;
    const nextCx = pivot.x + dx * cos - dy * sin;
    const nextCy = pivot.y + dx * sin + dy * cos;
    return { ...object, x: nextCx - object.width / 2, y: nextCy - object.height / 2, rotation: normalizeRotation(object.rotation + delta) };
  });
}

export function resizeObjects(objects: BioPlotObject[], next: Pick<Bounds, 'x' | 'y' | 'width' | 'height'>): BioPlotObject[] {
  const bounds = selectionBounds(objects);
  if (!bounds || !bounds.width || !bounds.height) return objects;
  const sx = next.width / bounds.width;
  const sy = next.height / bounds.height;
  return objects.map(object => ({
    ...object,
    x: next.x + (object.x - bounds.x) * sx,
    y: next.y + (object.y - bounds.y) * sy,
    width: Math.max(8, object.width * sx),
    height: Math.max(8, object.height * sy)
  }));
}

export function alignObjects(objects: BioPlotObject[], mode: AlignMode): BioPlotObject[] {
  const selection = selectionBounds(objects);
  if (!selection || objects.length < 2) return objects;
  return objects.map(object => {
    const bounds = objectBounds(object);
    let dx = 0;
    let dy = 0;
    if (mode === 'left') dx = selection.x - bounds.x;
    if (mode === 'center') dx = selection.cx - bounds.cx;
    if (mode === 'right') dx = selection.right - bounds.right;
    if (mode === 'top') dy = selection.y - bounds.y;
    if (mode === 'middle') dy = selection.cy - bounds.cy;
    if (mode === 'bottom') dy = selection.bottom - bounds.bottom;
    return { ...object, x: object.x + dx, y: object.y + dy };
  });
}

export function distributeObjects(objects: BioPlotObject[], axis: DistributionAxis): BioPlotObject[] {
  if (objects.length < 3) return objects;
  const ordered = [...objects].sort((a, b) => axis === 'horizontal' ? objectBounds(a).cx - objectBounds(b).cx : objectBounds(a).cy - objectBounds(b).cy);
  const first = objectBounds(ordered[0]);
  const last = objectBounds(ordered[ordered.length - 1]);
  const start = axis === 'horizontal' ? first.cx : first.cy;
  const end = axis === 'horizontal' ? last.cx : last.cy;
  const step = (end - start) / (ordered.length - 1);
  const positions = new Map<string, number>();
  ordered.forEach((object, index) => positions.set(object.id, start + step * index));
  return objects.map(object => {
    const bounds = objectBounds(object);
    const target = positions.get(object.id) ?? (axis === 'horizontal' ? bounds.cx : bounds.cy);
    return axis === 'horizontal' ? { ...object, x: object.x + target - bounds.cx } : { ...object, y: object.y + target - bounds.cy };
  });
}

export function reorderObjects(objects: BioPlotObject[], selectedIds: Set<string>, action: ZOrderAction) {
  if (!selectedIds.size) return objects;
  const next = [...objects];
  if (action === 'front') return [...next.filter(item => !selectedIds.has(item.id)), ...next.filter(item => selectedIds.has(item.id))];
  if (action === 'back') return [...next.filter(item => selectedIds.has(item.id)), ...next.filter(item => !selectedIds.has(item.id))];
  if (action === 'forward') {
    for (let i = next.length - 2; i >= 0; i--) if (selectedIds.has(next[i].id) && !selectedIds.has(next[i + 1].id)) [next[i], next[i + 1]] = [next[i + 1], next[i]];
  } else {
    for (let i = 1; i < next.length; i++) if (selectedIds.has(next[i].id) && !selectedIds.has(next[i - 1].id)) [next[i], next[i - 1]] = [next[i - 1], next[i]];
  }
  return next;
}

export function normalizeRotation(value: number) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export interface SnapTarget {
  axis: 'x' | 'y';
  value: number;
}

export function buildSnapTargets(document: BioPlotDocument, excludedIds: Set<string>): SnapTarget[] {
  const page = activePage(document);
  const targets: SnapTarget[] = [
    { axis: 'x', value: page.width / 2 },
    { axis: 'y', value: page.height / 2 }
  ];
  page.objects.filter(object => !excludedIds.has(object.id) && !object.hidden).forEach(object => {
    const b = objectBounds(object);
    targets.push(
      { axis: 'x', value: b.x }, { axis: 'x', value: b.cx }, { axis: 'x', value: b.right },
      { axis: 'y', value: b.y }, { axis: 'y', value: b.cy }, { axis: 'y', value: b.bottom }
    );
  });
  return targets;
}

export function snapDelta(bounds: Bounds, dx: number, dy: number, targets: SnapTarget[], threshold = 6) {
  const xs = [bounds.x + dx, bounds.cx + dx, bounds.right + dx];
  const ys = [bounds.y + dy, bounds.cy + dy, bounds.bottom + dy];
  let bestXDistance = Number.POSITIVE_INFINITY;
  let bestYDistance = Number.POSITIVE_INFINITY;
  let bestXValue: number | undefined;
  let bestYValue: number | undefined;
  targets.forEach(target => {
    const candidates = target.axis === 'x' ? xs : ys;
    candidates.forEach(candidate => {
      const distance = target.value - candidate;
      if (Math.abs(distance) > threshold) return;
      if (target.axis === 'x' && Math.abs(distance) < Math.abs(bestXDistance)) { bestXDistance = distance; bestXValue = target.value; }
      if (target.axis === 'y' && Math.abs(distance) < Math.abs(bestYDistance)) { bestYDistance = distance; bestYValue = target.value; }
    });
  });
  return {
    dx: dx + (Number.isFinite(bestXDistance) ? bestXDistance : 0),
    dy: dy + (Number.isFinite(bestYDistance) ? bestYDistance : 0),
    guideX: bestXValue,
    guideY: bestYValue
  };
}

export interface Command {
  label: string;
  execute(document: BioPlotDocument): BioPlotDocument;
  undo(document: BioPlotDocument): BioPlotDocument;
}

export class ObjectStateCommand implements Command {
  constructor(public label: string, private before: BioPlotObject[], private after: BioPlotObject[]) {}
  private apply(document: BioPlotDocument, objects: BioPlotObject[]) {
    const next = cloneDocument(document);
    const page = activePage(next);
    const byId = new Map(objects.map(object => [object.id, object]));
    page.objects = page.objects.map(object => byId.get(object.id) ?? object);
    next.updatedAt = new Date().toISOString();
    return next;
  }
  execute(document: BioPlotDocument) { return this.apply(document, this.after); }
  undo(document: BioPlotDocument) { return this.apply(document, this.before); }
}

export class PageObjectsCommand implements Command {
  constructor(public label: string, private before: BioPlotObject[], private after: BioPlotObject[]) {}
  private apply(document: BioPlotDocument, objects: BioPlotObject[]) {
    const next = cloneDocument(document);
    activePage(next).objects = structuredClone(objects);
    next.updatedAt = new Date().toISOString();
    return next;
  }
  execute(document: BioPlotDocument) { return this.apply(document, this.after); }
  undo(document: BioPlotDocument) { return this.apply(document, this.before); }
}

export class AddObjectsCommand implements Command {
  constructor(public label: string, private objects: BioPlotObject[]) {}
  execute(document: BioPlotDocument) {
    const next = cloneDocument(document);
    activePage(next).objects.push(...structuredClone(this.objects));
    next.updatedAt = new Date().toISOString();
    return next;
  }
  undo(document: BioPlotDocument) {
    const ids = new Set(this.objects.map(object => object.id));
    const next = cloneDocument(document);
    activePage(next).objects = activePage(next).objects.filter(object => !ids.has(object.id));
    next.updatedAt = new Date().toISOString();
    return next;
  }
}

export class DeleteObjectsCommand implements Command {
  private indexes = new Map<ObjectId, number>();
  constructor(public label: string, private objects: BioPlotObject[]) {}
  execute(document: BioPlotDocument) {
    const next = cloneDocument(document);
    const page = activePage(next);
    const ids = new Set(this.objects.map(object => object.id));
    page.objects.forEach((object, index) => { if (ids.has(object.id)) this.indexes.set(object.id, index); });
    page.objects = page.objects.filter(object => !ids.has(object.id));
    next.updatedAt = new Date().toISOString();
    return next;
  }
  undo(document: BioPlotDocument) {
    const next = cloneDocument(document);
    const page = activePage(next);
    const restored = [...page.objects];
    this.objects.slice().sort((a, b) => (this.indexes.get(a.id) ?? 0) - (this.indexes.get(b.id) ?? 0)).forEach(object => restored.splice(Math.min(this.indexes.get(object.id) ?? restored.length, restored.length), 0, structuredClone(object)));
    page.objects = restored;
    next.updatedAt = new Date().toISOString();
    return next;
  }
}

export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  constructor(private limit = 100) {}
  execute(document: BioPlotDocument, command: Command) { const next = command.execute(document); this.record(command); return next; }
  record(command: Command) { this.undoStack.push(command); if (this.undoStack.length > this.limit) this.undoStack.shift(); this.redoStack = []; }
  undo(document: BioPlotDocument) { const command = this.undoStack.pop(); if (!command) return document; this.redoStack.push(command); return command.undo(document); }
  redo(document: BioPlotDocument) { const command = this.redoStack.pop(); if (!command) return document; this.undoStack.push(command); return command.execute(document); }
  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }
}

// Keep undo/redo attached to the page where the edit was made, even after navigation.
class PageScopedCommand implements Command {
  constructor(private command:Command,private pageId:string){}
  get label(){return this.command.label;}
  private apply(document:BioPlotDocument,method:'execute'|'undo'){
    if(!document.pages.some(page=>page.id===this.pageId))return document;
    const next=cloneDocument(document);
    next.activePageId=this.pageId;
    return this.command[method](next);
  }
  execute(document:BioPlotDocument){return this.apply(document,'execute');}
  undo(document:BioPlotDocument){return this.apply(document,'undo');}
}

export class BioPlotStore {
  private document: BioPlotDocument;
  readonly history = new HistoryManager();
  private listeners = new Set<(document: BioPlotDocument) => void>();
  constructor(document: BioPlotDocument) { this.document = document; }
  get snapshot() { return this.document; }
  subscribe(listener: (document: BioPlotDocument) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  replace(document: BioPlotDocument) { this.document = document; this.emit(); }
  dispatch(command: Command) { this.document = this.history.execute(this.document, new PageScopedCommand(command,this.document.activePageId)); this.emit(); }
  undo() { this.document = this.history.undo(this.document); this.emit(); }
  redo() { this.document = this.history.redo(this.document); this.emit(); }
  preview(objects: BioPlotObject[]) {
    const next = cloneDocument(this.document);
    const page = activePage(next);
    const map = new Map(objects.map(object => [object.id, object]));
    page.objects = page.objects.map(object => map.get(object.id) ?? object);
    this.document = next;
    this.emit();
  }
  commitObjectState(before: BioPlotObject[], after: BioPlotObject[], label: string) {
    const command = new ObjectStateCommand(label, before, after);
    this.document = command.execute(this.document);
    this.history.record(new PageScopedCommand(command,this.document.activePageId));
    this.emit();
  }
  private emit() { this.listeners.forEach(listener => listener(this.document)); }
}
