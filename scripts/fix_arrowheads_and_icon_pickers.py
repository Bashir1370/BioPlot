"""Guarded, one-shot arrow tip and visual cap picker migration.

Runs in GitHub Actions with the full checked-out tree. Abort if any source anchor
has drifted, and only commit after typecheck, unit tests, and production build.
"""
from pathlib import Path


def patch(path: str, old: str, new: str) -> None:
    file = Path('src') / path
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one anchor, found {count}: {old[:100]!r}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')
    print('Patched', file)


def replace_between(path: str, start: str, end: str, new: str) -> None:
    file = Path('src') / path
    text = file.read_text(encoding='utf-8')
    if text.count(start) != 1 or text.count(end) != 1:
        raise RuntimeError(f'{path}: start/end anchors must each occur exactly once')
    a, b = text.index(start), text.index(end)
    if b <= a:
        raise RuntimeError(f'{path}: misplaced source anchors')
    file.write_text(text[:a] + new + text[b:], encoding='utf-8')
    print('Patched section in', file)

patch('model.ts',
      "export type LineCap = 'none'|'arrow'|'circle'|'bar'|'diamond';",
      "export type LineCap = 'none'|'arrow'|'open-arrow'|'slim-arrow'|'triangle'|'stealth'|'chevron'|'double-arrow'|'circle'|'filled-circle'|'bar'|'diamond'|'square';")
patch('lineGeometry.ts',
      "const caps: LineCap[] = ['none', 'arrow', 'circle', 'bar', 'diamond'];",
      "const caps: LineCap[] = ['none', 'arrow', 'open-arrow', 'slim-arrow', 'triangle', 'stealth', 'chevron', 'double-arrow', 'circle', 'filled-circle', 'bar', 'diamond', 'square'];")

replace_between('lineGeometry.ts',
    '  const cap = (kind: LineCap, at: LinePoint, neighbor: LinePoint) => {',
    "  const mode = modes.includes(line.pathMode ?? 'straight')",
'''  // The stored endpoints are the EXACT visible tips. The shaft is shortened
  // inside any closed marker, preventing its rounded stroke from protruding
  // beyond the arrow tip. Both renderer and exported SVG use this same body.
  const measure = (kind: LineCap, at: LinePoint, neighbor: LinePoint) => {
    const segment = Math.hypot(neighbor.x - at.x, neighbor.y - at.y);
    const large = kind === 'diamond' || kind === 'double-arrow';
    return Math.max(1, Math.min(Math.max(9, width * 3.2), segment * (large ? .22 : .34)));
  };
  const inset = (kind: LineCap, size: number) => {
    if (kind === 'arrow' || kind === 'slim-arrow' || kind === 'triangle' || kind === 'stealth') return size * .8;
    if (kind === 'double-arrow') return size * 1.7;
    if (kind === 'diamond') return size * 1.88;
    if (kind === 'circle' || kind === 'filled-circle') return size * .9;
    if (kind === 'square') return size * .92;
    return 0;
  };
  const towards = (at: LinePoint, neighbor: LinePoint, distance: number): LinePoint => {
    const length = Math.max(.001, Math.hypot(neighbor.x - at.x, neighbor.y - at.y));
    return { x: at.x + (neighbor.x - at.x) / length * distance,
             y: at.y + (neighbor.y - at.y) / length * distance };
  };
  const startSize = measure(startHead, first, pts[1]);
  const endSize = measure(endHead, last, pts[pts.length - 2]);
  const shaft = pts.map(point => ({ ...point }));
  shaft[0] = towards(first, pts[1], inset(startHead, startSize));
  shaft[shaft.length - 1] = towards(last, pts[pts.length - 2], inset(endHead, endSize));

  const cap = (kind: LineCap, at: LinePoint, neighbor: LinePoint, size: number): string => {
    if (kind === 'none') return '';
    const dx = neighbor.x - at.x, dy = neighbor.y - at.y;
    const length = Math.max(.001, Math.hypot(dx, dy));
    const ux = dx / length, uy = dy / length, nx = -uy, ny = ux;
    const point = (along: number, across = 0) =>
      `${fmt(at.x + ux * along + nx * across)},${fmt(at.y + uy * along + ny * across)}`;
    const tip = point(0);
    const fillPath = (d: string) => `<path d="${d}" fill="${stroke}"/>`;
    const v = (distance: number, spread: number) =>
      `M${point(distance, spread)}L${tip}L${point(distance, -spread)}`;
    switch (kind) {
      case 'arrow': return fillPath(`${v(size, size * .48)}Z`);
      case 'slim-arrow': return fillPath(`${v(size, size * .26)}Z`);
      case 'triangle': return fillPath(`${v(size, size * .73)}Z`);
      case 'stealth': return fillPath(`M${tip}L${point(size, size * .5)}L${point(size * .7)}L${point(size, -size * .5)}Z`);
      case 'open-arrow': return `<path d="${v(size, size * .48)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="miter" stroke-linecap="butt"/>`;
      case 'chevron': return `<path d="${v(size, size * .5)}M${point(size * 1.65, size * .5)}L${point(size * .65)}L${point(size * 1.65, -size * .5)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="miter" stroke-linecap="butt"/>`;
      case 'double-arrow': return fillPath(`${v(size, size * .43)}Z M${point(size * .8)}L${point(size * 1.8, size * .43)}L${point(size * 1.8, -size * .43)}Z`);
      case 'circle':
      case 'filled-circle': {
        const radius = size * .45;
        const center = towards(at, neighbor, radius);
        return `<circle cx="${fmt(center.x)}" cy="${fmt(center.y)}" r="${fmt(radius)}" fill="${kind === 'circle' ? 'white' : stroke}" stroke="${stroke}" stroke-width="${width}"/>`;
      }
      case 'bar': return `<path d="M${point(0,size * .62)}L${point(0,-size * .62)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="butt"/>`;
      case 'diamond': return fillPath(`M${tip}L${point(size, size * .48)}L${point(size * 2)}L${point(size,-size * .48)}Z`);
      case 'square': return fillPath(`M${point(0,size * .46)}L${point(size,size * .46)}L${point(size,-size * .46)}L${point(0,-size * .46)}Z`);
      default: return '';
    }
  };
''')

patch('lineGeometry.ts',
'''  const geometry = pathData(pts, mode);
  return `<path d="${geometry}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash}/>${cap(startHead,first,pts[1])}${cap(endHead,last,pts[pts.length-2])}`;
}''',
'''  const geometry = pathData(shaft, mode);
  const flat = ['bar','open-arrow','chevron'].includes(startHead) || ['bar','open-arrow','chevron'].includes(endHead);
  return `<path d="${geometry}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="${flat ? 'butt' : 'round'}" stroke-linejoin="round"${dash}/>${cap(startHead,first,pts[1],startSize)}${cap(endHead,last,pts[pts.length-2],endSize)}`;
}''')
patch('lineGeometry.ts',
    '/** Admin-authored native presets carry validated settings in inert SVG attributes. */',
'''/** Preview uses the exact production marker geometry, mirrored at the two endpoints. */
export function lineCapPreviewSvg(kind: LineCap, side: 'start' | 'end'): string {
  const sample = createDrawnLine({x:14,y:24},{x:106,y:24},{
    stroke:'#153e4b',strokeWidth:3,lineStyle:'solid',
    startHead:side==='start'?kind:'none',endHead:side==='end'?kind:'none',
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 48" width="120" height="48" aria-hidden="true"><g transform="translate(${fmt(sample.x)} ${fmt(sample.y)})">${lineSvgBody(sample)}</g></svg>`;
}

/** Admin-authored native presets carry validated settings in inert SVG attributes. */''')

patch('NativePathControls.tsx',
    "import { insertLineNode, lineFromWorldNodes, removeLineNode, worldLineNodes, type DrawLineSettings, type PathMode } from './lineGeometry';",
    "import { insertLineNode, lineCapPreviewSvg, lineFromWorldNodes, removeLineNode, worldLineNodes, type DrawLineSettings, type PathMode } from './lineGeometry';")
replace_between('NativePathControls.tsx',
    'const caps: Array<{ value: LineCap; en: string; fa: string }> = [',
    '\nexport function NativePathControls',
'''const caps: Array<{ value: LineCap; en: string; fa: string }> = [
  { value:'none',en:'None',fa:'بدون سر' },
  { value:'arrow',en:'Filled arrow',fa:'پیکان توپر' },
  { value:'open-arrow',en:'Open arrow',fa:'پیکان توخالی' },
  { value:'slim-arrow',en:'Narrow arrow',fa:'پیکان باریک' },
  { value:'triangle',en:'Triangle',fa:'مثلثی' },
  { value:'stealth',en:'Stealth arrow',fa:'پیکان فرورفته' },
  { value:'chevron',en:'Double chevron',fa:'دوشاخه' },
  { value:'double-arrow',en:'Double arrow',fa:'دو پیکان' },
  { value:'circle',en:'Open circle',fa:'دایره توخالی' },
  { value:'filled-circle',en:'Filled circle',fa:'دایره توپر' },
  { value:'bar',en:'Inhibition bar',fa:'خط مهاری' },
  { value:'diamond',en:'Diamond',fa:'لوزی' },
  { value:'square',en:'Square',fa:'مربع' },
];
''')
replace_between('NativePathControls.tsx',
    '''    <div className="bp-path-palette">{(['startHead','endHead'] as const).map(field=>''',
    '''    <div className="bp-path-caps-title"><strong>{fa?'ویرایش گره‌ها':'Path nodes'}</strong>''',
'''    <div className="bp-cap-row">{(['startHead','endHead'] as const).map(field=>{
      const side = field==='startHead'?'start':'end';
      const selected = line[field] ?? (side==='start'?'none':'arrow');
      return <div className="bp-cap-field" key={field}>
        <span className="bp-cap-label">{side==='start'?(fa?'ابتدا':'Start'):(fa?'انتها':'End')}</span>
        <details className="bp-cap-picker" name="bp-line-cap-picker">
          <summary aria-label={side==='start'?(fa?'انتخاب شکل ابتدای خط':'Choose start icon'):(fa?'انتخاب شکل انتهای خط':'Choose end icon')} aria-disabled={locked} onClick={event=>{if(locked)event.preventDefault();}}>
            <span className="bp-cap-current" dangerouslySetInnerHTML={{__html:lineCapPreviewSvg(selected,side)}} />
            <span className="bp-cap-chevron" aria-hidden="true">⌄</span>
          </summary>
          <div className="bp-cap-grid" role="group" aria-label={side==='start'?(fa?'نمادهای ابتدای خط':'Start arrow icons'):(fa?'نمادهای انتهای خط':'End arrow icons')}>
            {caps.map(cap=><button key={cap.value} type="button" className={cap.value===selected?'is-selected':''} aria-pressed={cap.value===selected} aria-label={`${side==='start'?(fa?'ابتدا':'Start'):(fa?'انتها':'End')}: ${fa?cap.fa:cap.en}`} title={fa?cap.fa:cap.en} disabled={locked} onClick={event=>{change({[field]:cap.value},'Line endpoint icon');event.currentTarget.closest('details')?.removeAttribute('open');}}>
              <span className="bp-cap-icon" dangerouslySetInnerHTML={{__html:lineCapPreviewSvg(cap.value,side)}} />
              <small>{fa?cap.fa:cap.en}</small>
            </button>)}
          </div>
        </details>
      </div>;
    })}</div>
''')

css = Path('src/native-path-controls.css')
css_text = css.read_text(encoding='utf-8')
if '.bp-cap-row' in css_text:
    raise RuntimeError('Caps CSS already present; refusing to duplicate styles')
css.write_text(css_text + '''\n/* The whole row owns the picker overlay, so both Start and End have room for real icons. */
.bp-cap-row{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;min-width:0}
.bp-cap-row:has(.bp-cap-picker[open]){padding-bottom:335px}
.bp-cap-field{min-width:0;display:grid;align-content:start;gap:7px}
.bp-cap-label{color:#36525b;font-size:13px;font-weight:800}
.bp-cap-picker{min-width:0}
.bp-cap-picker summary{list-style:none;display:flex;align-items:center;justify-content:center;gap:6px;min-height:55px;cursor:pointer;border:1px solid #cbdcde;border-radius:11px;background:white;padding:5px 6px;transition:background .15s,border-color .15s}
.bp-cap-picker summary::-webkit-details-marker{display:none}
.bp-cap-picker summary:hover,.bp-cap-picker[open] summary{border-color:#078e88;background:#eefaf7}
.bp-cap-picker summary:focus-visible,.bp-cap-grid button:focus-visible{outline:3px solid #64c8bd;outline-offset:2px}
.bp-cap-picker summary[aria-disabled='true']{opacity:.48;cursor:not-allowed}
.bp-cap-current{display:block;min-width:0;flex:1;height:37px}
.bp-cap-current svg{display:block;width:100%;height:100%}
.bp-cap-chevron{font-size:20px;line-height:1;color:#087f79}
.bp-cap-grid{position:absolute;z-index:30;top:100%;left:0;right:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;max-height:325px;overflow:auto;padding:9px;border:1px solid #bedbd7;border-radius:13px;background:#fff;box-shadow:0 10px 26px #143d4d24}
.bp-cap-grid button{min-width:0;min-height:66px;padding:5px 3px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1px;border:1px solid #d9e6e8;border-radius:8px;background:#fff;color:#294852;cursor:pointer}
.bp-cap-grid button:hover{border-color:#44aea2;background:#eff9f6}
.bp-cap-grid button.is-selected{border:2px solid #087f79;background:#e6f8f4}
.bp-cap-icon{display:block;width:100%;height:29px}
.bp-cap-icon svg{display:block;width:100%;height:100%}
.bp-cap-grid small{display:block;max-width:100%;font:650 10px/1.25 Inter,Vazirmatn,sans-serif;overflow-wrap:anywhere;text-align:center}
@media(max-width:380px){.bp-cap-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bp-cap-row:has(.bp-cap-picker[open]){padding-bottom:330px}}
''', encoding='utf-8')
print('Patched', css)

Path('src/line-heads.test.tsx').write_text('''import { createElement } from 'react';
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
    const shaft = svg.match(/^<path d="M[\\d.]+ [\\d.]+L([\\d.]+) ([\\d.]+)"/);
    expect(shaft).not.toBeNull();
    expect(Number(shaft![1])).toBeLessThan(tipX);
    expect(svg).toContain(`M${tipX},${tipY}`);
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
''', encoding='utf-8')
print('Added native arrowhead regression tests')
