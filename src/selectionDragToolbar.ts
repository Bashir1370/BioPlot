const DRAG_THRESHOLD_PX = 4;
const SUPPRESSED_CLASS = 'selection-toolbar-suppressed';

let installed = false;

export function installSelectionDragToolbarBehavior() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let dragging = false;

  const shell = () => document.querySelector<HTMLElement>('.studio-shell');

  const resetPointer = () => {
    pointerId = null;
    dragging = false;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('.studio-object')) return;

    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dragging = false;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (pointerId !== event.pointerId || dragging) return;
    const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
    if (distance < DRAG_THRESHOLD_PX) return;

    dragging = true;
    shell()?.classList.add(SUPPRESSED_CLASS);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;

    // A true drag leaves the toolbar hidden after drop. A plain click brings it back.
    if (!dragging) shell()?.classList.remove(SUPPRESSED_CLASS);
    resetPointer();
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    resetPointer();
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('pointermove', onPointerMove, true);
  window.addEventListener('pointerup', onPointerUp, true);
  window.addEventListener('pointercancel', onPointerCancel, true);
}
