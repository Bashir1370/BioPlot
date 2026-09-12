const DOM_DELTA_LINE = 1;
const DOM_DELTA_PAGE = 2;
const STEP_THRESHOLD = 18;

let installed = false;
let accumulatedDelta = 0;
let resetTimer: number | null = null;

function normalizeDelta(event: WheelEvent) {
  const multiplier = event.deltaMode === DOM_DELTA_LINE ? 16 : event.deltaMode === DOM_DELTA_PAGE ? 120 : 1;
  return event.deltaY * multiplier;
}

function zoomControls() {
  const controls = document.querySelector('.reference-zoom-controls');
  if (!(controls instanceof HTMLElement)) return null;
  const buttons = Array.from(controls.querySelectorAll('button'));
  const minus = buttons[0] as HTMLButtonElement | undefined;
  const plus = buttons[1] as HTMLButtonElement | undefined;
  const range = controls.querySelector('input[type="range"]') as HTMLInputElement | null;
  if (!minus || !plus || !range) return null;
  return { minus, plus, range };
}

function keepPointerAnchored(viewport: HTMLElement, scale: HTMLElement, event: WheelEvent, action: () => void) {
  const before = scale.getBoundingClientRect();
  const pointerX = event.clientX;
  const pointerY = event.clientY;
  const anchorX = pointerX - before.left;
  const anchorY = pointerY - before.top;
  const currentZoom = Number(zoomControls()?.range.value ?? 100) / 100;
  if (!Number.isFinite(currentZoom) || currentZoom <= 0) {
    action();
    return;
  }

  const worldX = anchorX / currentZoom;
  const worldY = anchorY / currentZoom;
  action();

  requestAnimationFrame(() => {
    const nextZoom = Number(zoomControls()?.range.value ?? Math.round(currentZoom * 100)) / 100;
    const after = scale.getBoundingClientRect();
    const targetX = after.left + worldX * nextZoom;
    const targetY = after.top + worldY * nextZoom;
    viewport.scrollLeft += targetX - pointerX;
    viewport.scrollTop += targetY - pointerY;
  });
}

function handleCanvasWheel(event: WheelEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;

  const viewport = event.target.closest('.studio-canvas-scroll');
  if (!(viewport instanceof HTMLElement)) return;
  const scale = viewport.querySelector('.studio-artboard-scale');
  if (!(scale instanceof HTMLElement)) return;

  const controls = zoomControls();
  if (!controls) return;

  event.preventDefault();
  event.stopPropagation();

  accumulatedDelta += normalizeDelta(event);
  if (resetTimer !== null) window.clearTimeout(resetTimer);
  resetTimer = window.setTimeout(() => { accumulatedDelta = 0; }, 120);

  if (Math.abs(accumulatedDelta) < STEP_THRESHOLD) return;

  const zoomIn = accumulatedDelta < 0;
  accumulatedDelta = 0;
  const button = zoomIn ? controls.plus : controls.minus;
  if (button.disabled) return;

  keepPointerAnchored(viewport, scale, event, () => button.click());
}

export function installCanvasWheelZoomV2() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener('wheel', handleCanvasWheel, { capture: true, passive: false });
}
