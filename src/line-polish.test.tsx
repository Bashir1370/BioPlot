import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createDrawnLine, worldLineNodes } from './lineGeometry';
import { rotateObjects } from './engine';
import { NativePathControls } from './NativePathControls';

const settings = { stroke:'#087f79',strokeWidth:2,lineStyle:'solid' as const,startHead:'none' as const,endHead:'arrow' as const };
describe('line editor polish', () => {
  it('rotates both endpoints together around the selection center', () => {
    const line=createDrawnLine({x:25,y:90},{x:225,y:90},settings);
    const rotated=rotateObjects([line],90)[0];
    if(rotated.type!=='arrow')throw new Error('Not an editable line');
    const [a,b]=worldLineNodes(rotated);
    expect(a.x).toBeCloseTo(b.x,5);
    expect(b.y-a.y).toBeCloseTo(200,5);
  });
  it('keeps graphical endpoints and adds compact rotation without instructional paragraphs', () => {
    const line=createDrawnLine({x:20,y:80},{x:220,y:80},settings);
    const html=renderToStaticMarkup(createElement(NativePathControls,{fa:false,line,onCommit:vi.fn()}));
    expect(html).toContain('Choose start icon');
    expect(html).toContain('Choose end icon');
    expect(html).toContain('Line rotation angle');
    expect(html).toContain('Rotate line 90 degrees');
    expect(html).not.toContain('bp-path-help');
  });
});
