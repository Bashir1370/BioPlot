import {describe,expect,it} from 'vitest';
import {documentToSvg} from './export';
import {createBlankDocument} from './model';
import {makeShape} from './editorObjects';
describe('selection export geometry',()=>{
 it('crops a rotated object to its visible rotated bounds, including stroke',()=>{
  const doc=createBlankDocument();const object={...makeShape('rect',100,100),width:100,height:20,rotation:90,strokeWidth:2};
  doc.pages[0].objects=[object];
  const svg=documentToSvg(doc,{cropToSelection:true,objectIds:new Set([object.id]),transparent:true});
  const box=svg.match(/viewBox="([^"]+)"/)![1].split(' ').map(Number);
  expect(box[2]).toBeCloseTo(22);expect(box[3]).toBeCloseTo(102);
  expect(svg).toContain('translate(-39 41)');
 });
 it('keeps the whole artboard when selection cropping is disabled',()=>{
  const doc=createBlankDocument();doc.pages[0].objects=[makeShape('rect')];
  expect(documentToSvg(doc)).toContain('viewBox="0 0 960 620"');
 });
});
