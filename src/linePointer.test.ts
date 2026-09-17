import { describe, expect, it } from 'vitest';
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
