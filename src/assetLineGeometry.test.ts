import {describe,it,expect} from 'vitest';
import {assetLineEndpoints,updateAssetLineEndpoint} from './assetLineGeometry';
import {assetSvgWithTint} from './assetStyling';
import {createBlankDocument,migrateDocument,type AssetObject} from './model';
import {documentToSvg} from './export';
const asset:AssetObject={id:'a',type:'asset',assetId:'upload',name:'Arrow',svg:'<svg viewBox="0 0 100 20"><path d="M0 10H100"/></svg>',colors:[],x:50,y:70,width:100,height:20,rotation:0,opacity:1,lineAsset:true};
describe('uploaded arrow endpoints',()=>{
 it('moves either endpoint of rotated artwork while fixing the opposite end',()=>{
  for(const rotation of [0,45,90,180,-60])for(const index of [0,1]){
   const source={...asset,rotation};const fixed=assetLineEndpoints(source)[1-index];
   const moved=updateAssetLineEndpoint(source,index,{x:270,y:150});
   const endpoints=assetLineEndpoints(moved);
   expect(endpoints[index].x).toBeCloseTo(270);expect(endpoints[index].y).toBeCloseTo(150);
   expect(endpoints[1-index].x).toBeCloseTo(fixed.x);expect(endpoints[1-index].y).toBeCloseTo(fixed.y);
   expect(moved.height).toBe(asset.height);expect(moved.svg).toBe(asset.svg);
  }
 });
 it('ignores locked, invalid and collapsed drags',()=>{
  expect(updateAssetLineEndpoint({...asset,locked:true},1,{x:5,y:5}).width).toBe(100);
  expect(updateAssetLineEndpoint(asset,1,{x:NaN,y:5})).toBe(asset);
  expect(updateAssetLineEndpoint(asset,1,assetLineEndpoints(asset)[0])).toBe(asset);
 });
 it('retains artwork and edited geometry through save, reopen and export',()=>{
  const changed=updateAssetLineEndpoint(asset,1,{x:200,y:200});
  const doc=createBlankDocument();doc.pages[0].objects=[changed];
  const restored=migrateDocument(JSON.parse(JSON.stringify(doc)));
  expect(restored.pages[0].objects[0]).toEqual(changed);
  expect(assetSvgWithTint(changed)).toContain('preserveAspectRatio="none"');
  expect(documentToSvg(restored)).toContain('preserveAspectRatio="none"');
  expect(assetSvgWithTint({...changed,lineAsset:false})).toBe(asset.svg);
 });
 it('places handles at visible tips of artwork with asymmetric transparent margins',()=>{
  const crop={left:.1,right:.75,centerY:.3};
  const points=assetLineEndpoints(asset,crop);
  expect(points[0]).toEqual({x:60,y:76});expect(points[1]).toEqual({x:125,y:76});
 });
 it('keeps the visible opposite tip fixed while dragging padded artwork at any rotation',()=>{
  const crop={left:.12,right:.81,centerY:.28};
  for(const rotation of [0,37,90,180,-65])for(const index of [0,1]){
   const source={...asset,rotation},before=assetLineEndpoints(source,crop);
   const changed=updateAssetLineEndpoint(source,index,{x:280,y:210},crop);
   const after=assetLineEndpoints(changed,crop);
   expect(after[index].x).toBeCloseTo(280);expect(after[index].y).toBeCloseTo(210);
   expect(after[1-index].x).toBeCloseTo(before[1-index].x);expect(after[1-index].y).toBeCloseTo(before[1-index].y);
   expect(changed.height).toBe(source.height);expect(changed.svg).toBe(source.svg);
  }
 });
 it('does not jump when dragging begins exactly at a padded visible tip',()=>{
  const crop={left:.15,right:.8,centerY:.25};const source={...asset,rotation:33};
  const changed=updateAssetLineEndpoint(source,1,assetLineEndpoints(source,crop)[1],crop);
  expect(changed.x).toBeCloseTo(source.x);expect(changed.y).toBeCloseTo(source.y);expect(changed.width).toBeCloseTo(source.width);expect(changed.rotation).toBeCloseTo(source.rotation);
 });
});
