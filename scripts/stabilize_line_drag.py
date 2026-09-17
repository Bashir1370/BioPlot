#!/usr/bin/env python3
"""Apply a one-time, anchor-checked fix for jumping editable line nodes.
All anchors must match exactly before any existing source file is written.
"""
from pathlib import Path

src = Path('src')

def replace_once(text: str, old: str, new: str, filename: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{filename}: expected one anchor, got {count}: {old[:120]!r}')
    return text.replace(old, new, 1)

editor = (src / 'EditorStudio.tsx').read_text(encoding='utf-8')
css = (src / 'line-polish.css').read_text(encoding='utf-8')

editor = replace_once(
    editor,
    "import './line-drawing.css';",
    "import './line-drawing.css';\nimport { lineNodeDragPoint } from './linePointer';",
    'EditorStudio.tsx',
)
# Opening the inspector changes the canvas viewport and possibly auto-fit zoom.
# Do it at pointer-up, never while a line is being dragged.
editor = replace_once(
    editor,
    "if(object.type==='arrow'){setInspectorCollapsed(false);setInspectorTab('properties');}setAssetEditOpen(object.type==='asset');",
    "if(object.type==='arrow'){setInspectorTab('properties');}setAssetEditOpen(object.type==='asset');",
    'EditorStudio.tsx',
)
editor = replace_once(
    editor,
    "setGuides({});};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});}",
    "setGuides({});if(object.type==='arrow')setInspectorCollapsed(false);};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});}",
    'EditorStudio.tsx',
)
old_node = """    const before=[structuredClone(line)];
    const rect=artboardRef.current.getBoundingClientRect();
    let changed=false;
    const move=(pointer:PointerEvent)=>{
      const point={x:Math.max(0,Math.min(page.width,(pointer.clientX-rect.left)/zoom)),y:Math.max(0,Math.min(page.height,(pointer.clientY-rect.top)/zoom))};
      // Shift constrains an endpoint to an exact horizontal or vertical line
      // through the opposite endpoint, independently of canvas zoom.
      if(pointer.shiftKey&&(index===0||index===selectedLineNodes.length-1)){
        const anchor=selectedLineNodes[index===0?selectedLineNodes.length-1:0];
        if(Math.abs(point.x-anchor.x)>=Math.abs(point.y-anchor.y))point.y=anchor.y;
        else point.x=anchor.x;
      }
      storeRef.current.preview([updateLineNode(line,index,point)]);changed=true;"""
new_node = """    const origin=selectedLineNodes[index];
    if(!origin)return;
    const opposite=selectedLineNodes[index===0?selectedLineNodes.length-1:0];
    const endpoint=index===0||index===selectedLineNodes.length-1;
    const pointerDown={x:event.clientX,y:event.clientY};
    const before=[structuredClone(line)];
    let changed=false;
    const move=(pointer:PointerEvent)=>{
      // Preserve the offset where the node was grabbed. Mapping the pointer
      // directly to the node made tiny handles jump on the first move.
      const point=lineNodeDragPoint(origin,pointerDown,{x:pointer.clientX,y:pointer.clientY},zoom,
        {width:page.width,height:page.height},pointer.shiftKey&&endpoint?opposite:undefined);
      storeRef.current.preview([updateLineNode(line,index,point)]);changed=true;"""
editor = replace_once(editor, old_node, new_node, 'EditorStudio.tsx')
css = replace_once(css, 'transition:transform .12s,box-shadow .12s', 'transition:box-shadow .12s,background-color .12s', 'line-polish.css')
css = replace_once(css, 'transform:translate(-50%,-50%) scale(1.15);box-shadow:', 'transform:translate(-50%,-50%);box-shadow:', 'line-polish.css')

helper = '''/** Pure, zoom-aware positioning for a dragged native path node. */
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
'''
test = '''import { describe, expect, it } from 'vitest';
import { lineNodeDragPoint } from './linePointer';

const canvas = {width:800,height:600};
describe('editable line drag stability', () => {
  it('does not jump on the first movement when grabbed away from node center', () => {
    const origin={x:100,y:125}, down={x:370,y:280};
    expect(lineNodeDragPoint(origin,down,down,1.7,canvas)).toEqual(origin);
    expect(lineNodeDragPoint(origin,down,{x:387,y:297},1.7,canvas)).toEqual({x:110,y:135});
  });
  it('keeps the initial node as its fixed reference through pointer movement', () => {
    const origin={x:150,y:90}, down={x:500,y:150};
    expect(lineNodeDragPoint(origin,down,{x:510,y:170},2,canvas)).toEqual({x:155,y:100});
    expect(lineNodeDragPoint(origin,down,{x:530,y:190},2,canvas)).toEqual({x:165,y:110});
  });
  it('aligns a Shift-dragged endpoint horizontally or vertically to the other endpoint', () => {
    const origin={x:100,y:100},down={x:0,y:0},other={x:240,y:100};
    expect(lineNodeDragPoint(origin,down,{x:140,y:220},1,canvas,other)).toEqual({x:240,y:320});
    expect(lineNodeDragPoint(origin,down,{x:90,y:0},1,canvas,other)).toEqual({x:190,y:100});
  });
  it('clamps to the canvas without changing the original node', () => {
    const origin={x:10,y:10};
    expect(lineNodeDragPoint(origin,{x:0,y:0},{x:-100,y:1000},1,canvas)).toEqual({x:0,y:600});
    expect(origin).toEqual({x:10,y:10});
  });
});
'''
# Existing-file anchors were all checked before the writes below.
(src / 'EditorStudio.tsx').write_text(editor, encoding='utf-8')
(src / 'line-polish.css').write_text(css, encoding='utf-8')
(src / 'linePointer.ts').write_text(helper, encoding='utf-8')
(src / 'linePointer.test.ts').write_text(test, encoding='utf-8')
print('Applied stable node drag, delayed inspector layout changes, and fixed node hover positioning.')
