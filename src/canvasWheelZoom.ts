const MIN_ZOOM = 0.1;
const MAX_ZOOM = 1.8;
const DOM_DELTA_LINE = 1;
const DOM_DELTA_PAGE = 2;

let installed = false;

function setNativeRangeValue(input: HTMLInputElement, value: number) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, String(Math.round(value * 100)));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function normalizedWheelDelta(event: WheelEvent) {
  const multiplier = event.deltaMode === DOM_DELTA_LINE ? 16 : event.deltaMode === DOM_DELTA_PAGE ? 120 : 1;
  return event.deltaY * multiplier;
}

function zoomCanvasAtPointer(event: WheelEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;

  const viewport = event.target.closest('.studio-canvas-scroll') as HTMLElement | null;
  if (!viewport) return;

  const scale = viewport.querySelector('.studio-artboard-scale') as HTMLElement | null;
  const range = document.querySelector('.reference-zoom-controls input[type="range"]') as HTMLInputElement | null;
  if (!scale || !range) return;

  const currentZoom = Number(range.value) / 100;
  if (!Number.isFinite(currentZoom) || currentZoom <= 0) return;

  const delta = normalizedWheelDelta(event);
  const requestedZoom = currentZoom * Math.exp(-delta * 0.0012);
  const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, requestedZoom));
  if (Math.abs(nextZoom - currentZoom) < 0.001) return;

  event.preventDefault();
  event.stopPropagation();

  const before = scale.getBoundingClientRect();
  const anchorX = event.clientX - before.left;
  const anchorY = event.clientY - before.top;
  const worldX = anchorX / currentZoom;
  const worldY = anchorY / currentZoom;
  const pointerX = event.clientX;
  const pointerY = event.clientY;

  setNativeRangeValue(range, nextZoom);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const after = scale.getBoundingClientRect();
      const targetX = after.left + worldX * nextZoom;
      const targetY = after.top + worldY * nextZoom;
      viewport.scrollLeft += targetX - pointerX;
      viewport.scrollTop += targetY - pointerY;
    });
  });
}

export function installCanvasWheelZoom() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener('wheel', zoomCanvasAtPointer, { capture: true, passive: false });
}
