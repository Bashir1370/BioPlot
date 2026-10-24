import {describe,expect,it} from 'vitest';
import {csvToPlotSpec,plotToSvg} from './plots';
describe('scientific plot data',()=>{
 it('reads quoted labels, escaped quotes, BOM and blank rows',()=>{
  const spec=csvToPlotSpec('\uFEFFGroup,Result\n"Control, A",2\n\n"A ""quoted"" label",-3\n');
  expect(spec.series[0].values.map(point=>point.label)).toEqual(['Control, A','A "quoted" label']);
  expect(spec.series[0].values.map(point=>point.y)).toEqual([2,-3]);
 });
 it.each(['Group,Result\nA,invalid','Group,Result\nA,','Group,Result\nA,Infinity','Group,Result\nA,1,2','Group,Result\n"A,1'])('rejects invalid data instead of converting it to zero: %s',csv=>{
  expect(()=>csvToPlotSpec(csv)).toThrow();
 });
 it('uses numeric X coordinates from a scatter CSV and scales them to the plot',()=>{
  const spec=csvToPlotSpec('Time,Value\n-10,-2\n30,4','scatter');
  expect(spec.series[0].values.map(point=>point.x)).toEqual([-10,30]);
  const circles=[...plotToSvg(spec,320,220).matchAll(/<circle cx="([^"]+)" cy="([^"]+)"/g)];
  expect(circles.map(match=>Number(match[1]))).toEqual([48,300]);
  expect(circles.every(match=>Number(match[2])>=34&&Number(match[2])<=176)).toBe(true);
 });
 it('renders negative bars using positive rectangle heights around zero',()=>{
  const svg=plotToSvg(csvToPlotSpec('Group,Value\nA,-5\nB,5'),320,220);
  const bars=[...svg.matchAll(/<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)];
  expect(bars).toHaveLength(2);
  expect(bars.every(match=>Number(match[4])>0)).toBe(true);
  expect(Number(bars[0][2])).toBeGreaterThan(Number(bars[1][2]));
 });
});
