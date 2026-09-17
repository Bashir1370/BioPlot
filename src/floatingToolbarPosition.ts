type Rect = {left:number;top:number;right:number;bottom:number};
/** All measurements are screen pixels; the toolbar never scales with the artwork. */
export function floatingToolbarPosition(selection:Rect, viewport:Rect, size:{width:number;height:number}) {
  const margin=10, gap=18;
  const minX=viewport.left+margin, maxX=Math.max(minX,viewport.right-size.width-margin);
  const minY=viewport.top+margin, maxY=Math.max(minY,viewport.bottom-size.height-margin);
  const above=selection.top-size.height-gap;
  const top=above>=minY?above:selection.bottom+gap;
  return {
    left:Math.max(minX,Math.min(maxX,(selection.left+selection.right-size.width)/2)),
    top:Math.max(minY,Math.min(maxY,top)),
    visible:selection.right>viewport.left&&selection.left<viewport.right&&selection.bottom>viewport.top&&selection.top<viewport.bottom,
  };
}
