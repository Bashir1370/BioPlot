import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createDrawnLine, lineCapPreviewSvg, lineSvgBody } from './lineGeometry';
import { NativePathControls } from './NativePathControls';
import type { LineCap } from './model';

const allCaps: LineCap[] = ['none','arrow','open-arrow','slim-arrow','triangle','stealth','chevron','double-arrow','circle','filled-circle','bar','diamond','square'];
const settings = { stroke:'#087f79', strokeWidth:3, lineStyle:'solid' as const, startHead:'none' as const, endHead:'arrow' as const };
describe('accurate line tips and pictorial arrowhead selectors', () => {
  it('terminates the shaft INSIDE a filled cap but leaves the tip exactly at the draggable endpoint', () => {
    const line = createDrawnLine({x:20,y:80},{x:220,y:80},settings);
    const svg = lineSvgBody(line);
    const tipX = Number((line.endPoint!.x * line.width).toFixed(3));
    const tipY = Number((line.endPoint!.y * line.height).toFixed(3));
    const shaft = svg.match(/^<path d="M[\d.]+ [\d.]+L([\d.]+) ([\d.]+)"/);
    expect(shaft).not.toBeNull();
    expect(Number(shaft![1])).toBeLessThan(tipX);
    expect(svg).toContain(`L${tipX},${tipY}`);
  });
  it('supports arrow icon options at BOTH ends using the production renderer', () => {
    for (const kind of allCaps) {
      for (const side of ['start','end'] as const) {
        const svg = lineCapPreviewSvg(kind,side);
        expect(svg).toContain('<svg');
        expect(svg).toContain('<path');
        expect(svg).not.toContain('NaN');
        expect(svg).not.toContain('undefined');
      }
    }
    const line = createDrawnLine({x:20,y:80},{x:220,y:80},{...settings,startHead:'double-arrow',endHead:'diamond'});
    expect(lineSvgBody(line).match(/fill="#087f79"/g)?.length).toBeGreaterThan(1);
  });
  it('renders a graphical, accessible icon choice grid for both Start and End', () => {
    const line = createDrawnLine({x:20,y:80},{x:220,y:80},settings);
    const markup = renderToStaticMarkup(createElement(NativePathControls,{fa:false,line,onCommit:vi.fn()}));
    expect(markup).toContain('Start arrow icons');
    expect(markup).toContain('End arrow icons');
    expect(markup).toContain('Choose start icon');
    expect(markup).toContain('Choose end icon');
    expect((markup.match(/class="bp-cap-icon"/g)||[]).length).toBe(26);
    expect(markup).toContain('aria-pressed="true"');
  });
});
