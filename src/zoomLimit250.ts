const MAX_ZOOM_PERCENT = 250;
const REACT_ZOOM_LIMIT_PERCENT = 180;
const ZOOM_STEP_PERCENT = 10;

let installed = false;

function zoomRange() {
  return document.querySelector('.reference-zoom-controls input[type="range"]') as HTMLInputElement | null;
}

function ensureExtendedRange() {
  const range = zoomRange();
  if (!range) return;
  if (range.max !== String(MAX_ZOOM_PERCENT)) range.max = String(MAX_ZOOM_PERCENT);
}

function setControlledRangeValue(range: HTMLInputElement, value: number) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(range, String(value));
  range.dispatchEvent(new Event('input', { bubbles: true }));
  range.dispatchEvent(new Event('change', { bubbles: true }));
}

function handleExtendedPlus(event: MouseEvent) {
  if (!(event.target instanceof Element)) return;
  const controls = event.target.closest('.reference-zoom-controls');
  if (!(controls instanceof HTMLElement)) return;

  const buttons = Array.from(controls.querySelectorAll('button'));
  const plus = buttons[1];
  if (!plus || !event.target.closest('button')?.isSameNode(plus)) return;

  const range = controls.querySelector('input[type="range"]') as HTMLInputElement | null;
  if (!range) return;
  ensureExtendedRange();

  const current = Number(range.value);
  if (!Number.isFinite(current) || current < REACT_ZOOM_LIMIT_PERCENT || current >= MAX_ZOOM_PERCENT) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  setControlledRangeValue(range, Math.min(MAX_ZOOM_PERCENT, current + ZOOM_STEP_PERCENT));
}

export function installZoomLimit250() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  ensureExtendedRange();
  document.addEventListener('click', handleExtendedPlus, true);

  const observer = new MutationObserver(ensureExtendedRange);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
