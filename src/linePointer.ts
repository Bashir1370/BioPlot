/** Pure, zoom-aware positioning for a dragged native path node. */
export type DragPoint = { x: number; y: number };
export type DragCanvas = { width: number; height: number };

const clamp = (value: number, maximum: number) => Math.max(0, Math.min(maximum, value));

/** Keep the original grab offset: no cursor snap when a small node is grabbed by its hit area. */
export function lineNodeDragPoint(
  origin: DragPoint,
  pointerDown: DragPoint,
  pointerNow: DragPoint,
  zoom: number,
  canvas: DragCanvas,
  alignTo?: DragPoint,
): DragPoint {
  const scale = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  let x = origin.x + (pointerNow.x - pointerDown.x) / scale;
  let y = origin.y + (pointerNow.y - pointerDown.y) / scale;
  if (alignTo) {
    if (Math.abs(x - alignTo.x) >= Math.abs(y - alignTo.y)) y = alignTo.y;
    else x = alignTo.x;
  }
  return { x: clamp(x, canvas.width), y: clamp(y, canvas.height) };
}
