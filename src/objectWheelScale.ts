import { activePage, BioPlotObject } from './model';
import { BioPlotStore, resizeObjects, selectionBounds } from './engine';

const SCALABLE_TYPES = new Set<BioPlotObject['type']>(['asset', 'image', 'shape', 'container', 'plot']);
const SESSION_DELAY_MS = 180;
const MIN_SIZE = 12;
const MAX_PAGE_MULTIPLIER = 4;

let installed = false;
let storeCaptureInstalled = false;
let activeStore: BioPlotStore | null = null;

type WheelSession = {
  store: BioPlotStore;
  key: string;
  ids: Set<string>;
  before: BioPlotObject[];
  timer: number | null;
};

let session: WheelSession | null = null;

function cloneObjects(objects: BioPlotObject[]) {
  return structuredClone(objects);
}

function installStoreCapture() {
  if (storeCaptureInstalled) return;
  storeCaptureInstalled = true;

  const originalSubscribe = BioPlotStore.prototype.subscribe;
  BioPlotStore.prototype.subscribe = function subscribeWithWheelStore(listener) {
    activeStore = this;
    const unsubscribe = originalSubscribe.call(this, listener);
    return () => {
      unsubscribe();
      if (activeStore === this) activeStore = null;
    };
  };
}

function visibleObjectForElement(element: Element, store: BioPlotStore) {
  const artboard = element.closest('.studio-artboard');
  if (!artboard) return null;

  const objectElement = element.closest('.studio-object');
  if (!objectElement) return null;

  const objectElements = Array.from(artboard.children).filter(child => child.classList.contains('studio-object'));
  const index = objectElements.indexOf(objectElement);
  if (index < 0) return null;

  const page = activePage(store.snapshot);
  const visibleObjects = page.objects.filter(object => !object.hidden);
  return visibleObjects[index] ?? null;
}

function sessionAfter(current: WheelSession) {
  const page = activePage(current.store.snapshot);
  return cloneObjects(page.objects.filter(object => current.ids.has(object.id)));
}

function finishSession() {
  if (!session) return;
  const current = session;
  session = null;
  if (current.timer !== null) window.clearTimeout(current.timer);

  const after = sessionAfter(current);
  if (!after.length) return;
  if (JSON.stringify(current.before) === JSON.stringify(after)) return;
  current.store.commitObjectState(current.before, after, 'Scale objects');
}

function scheduleSessionFinish() {
  if (!session) return;
  if (session.timer !== null) window.clearTimeout(session.timer);
  session.timer = window.setTimeout(finishSession, SESSION_DELAY_MS);
}

function scaleHoveredObject(event: WheelEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest('.studio-artboard')) return;
  if (!event.target.closest('.studio-object')) return;

  const store = activeStore;
  if (!store) return;

  const hovered = visibleObjectForElement(event.target, store);
  if (!hovered || !SCALABLE_TYPES.has(hovered.type) || hovered.locked) return;

  const page = activePage(store.snapshot);
  const targetObjects = hovered.groupId
    ? page.objects.filter(object => object.groupId === hovered.groupId)
    : [hovered];
  if (!targetObjects.length || targetObjects.some(object => object.locked)) return;

  const bounds = selectionBounds(targetObjects);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;

  const ids = new Set(targetObjects.map(object => object.id));
  const key = `${page.id}:${[...ids].sort().join(',')}`;
  if (session && (session.store !== store || session.key !== key)) finishSession();

  if (!session) {
    session = {
      store,
      key,
      ids,
      before: cloneObjects(targetObjects),
      timer: null,
    };
  }

  const normalizedDelta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 120 : 1);
  const requestedFactor = Math.min(1.1, Math.max(0.9, Math.exp(-normalizedDelta * 0.00125)));
  const minFactor = Math.max(MIN_SIZE / bounds.width, MIN_SIZE / bounds.height);
  const maxFactor = Math.min(
    (page.width * MAX_PAGE_MULTIPLIER) / bounds.width,
    (page.height * MAX_PAGE_MULTIPLIER) / bounds.height,
  );
  const factor = Math.min(maxFactor, Math.max(minFactor, requestedFactor));
  if (!Number.isFinite(factor) || Math.abs(factor - 1) < 0.0001) return;

  event.preventDefault();
  event.stopPropagation();

  const nextWidth = bounds.width * factor;
  const nextHeight = bounds.height * factor;
  const nextBounds = {
    x: bounds.cx - nextWidth / 2,
    y: bounds.cy - nextHeight / 2,
    width: nextWidth,
    height: nextHeight,
  };

  store.preview(resizeObjects(targetObjects, nextBounds));
  scheduleSessionFinish();
}

export function installObjectWheelScaling() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  installStoreCapture();

  document.addEventListener('wheel', scaleHoveredObject, { capture: true, passive: false });
  window.addEventListener('blur', finishSession);
  window.addEventListener('beforeunload', finishSession);
}
