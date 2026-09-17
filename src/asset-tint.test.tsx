import {Children,createElement,isValidElement,type ReactElement,type ReactNode} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect,vi} from 'vitest';
import {assetSvgWithTint,assetCssFilter,setAssetTint,resetAssetVisualStyle} from './assetStyling';
import {EditorObjectView} from './EditorObjectView';
import {SelectionProperties} from './EditorInspector';
import {objectToSvg} from './export';
import {createBlankDocument,migrateDocument,type AssetObject} from './model';
import {BioPlotStore,ObjectStateCommand,selectionBounds} from './engine';
const asset:AssetObject={id:'uploaded-arrow',type:'asset',assetId:'arrow',name:'Arrow',x:0,y:0,width:190,height:63,rotation:0,opacity:1,colors:[],svg:'<svg viewBox="0 0 300 100"><image href="data:image/png;base64,iVBORw0KGgo=" width="300" height="100"/></svg>'};
function elements(node:ReactNode):ReactElement<Record<string,any>>[]{
 if(!isValidElement<Record<string,any>>(node))return [];
 return [node,...Children.toArray(node.props.children).flatMap(elements)];
}
describe('uploaded arrow colors',()=>{
 it('uses an alpha-preserving solid color in both the canvas and export without changing the original PNG',()=>{
  const next=setAssetTint(asset,'#ff4400');
  expect(next.svg).toBe(asset.svg);
  expect(assetSvgWithTint(next)).toContain('flood-color="#ff4400"');
  expect(assetSvgWithTint(next)).toContain('in2="SourceGraphic" operator="in"');
  const live=renderToStaticMarkup(createElement(EditorObjectView,{object:next,selected:false,onPointerDown:vi.fn(),onContextMenu:vi.fn()}));
  for(const output of [live,objectToSvg(next)]){
   expect(output).toContain('flood-color="#ff4400"');
   expect(output).toContain('data:image/png;base64,iVBORw0KGgo=');
  }
  expect(assetSvgWithTint(setAssetTint(next))).toBe(asset.svg);
 });
 it('supports SVG arrows, independent copies and repeated color changes without stacking filters',()=>{
  const vector={...asset,svg:'<svg viewBox="0 0 100 20"><path d="M0 10H100" stroke="black"/></svg>'};
  const red=setAssetTint(vector,'#ff0000');
  const blue=setAssetTint(red,'#0000ff');
  expect(assetSvgWithTint(blue).match(/<filter /g)).toHaveLength(1);
  expect(assetSvgWithTint(blue)).not.toContain('flood-color="#ff0000"');
  expect(assetSvgWithTint({...red,id:'copy'})).not.toBe(assetSvgWithTint(red));
  expect(assetSvgWithTint(setAssetTint(blue))).toBe(vector.svg);
 });
 it('persists through save/reload and undo/redo',()=>{
  const doc=createBlankDocument();doc.pages[0].objects=[asset];
  const store=new BioPlotStore(doc),next=setAssetTint(asset,'#123456');
  store.dispatch(new ObjectStateCommand('Image color',[asset],[next]));
  expect(store.snapshot.pages[0].objects[0]).toMatchObject({tintColor:'#123456'});
  store.undo();expect(store.snapshot.pages[0].objects[0]).not.toHaveProperty('tintColor');
  store.redo();
  const restored=migrateDocument(JSON.parse(JSON.stringify(store.snapshot)));
  expect(objectToSvg(restored.pages[0].objects[0])).toContain('flood-color="#123456"');
 });
 it('wires the toolbar swatch and reset, respecting locks and invalid color input',()=>{
  const onCommit=vi.fn();
  const selected=setAssetTint(asset,'#112233');
  const nodes=elements(SelectionProperties({fa:false,bounds:selectionBounds([selected]),selectedObjects:[selected],onBounds:vi.fn(),onCommit,onLock:vi.fn(),onHide:vi.fn()}));
  const picker=nodes.find(n=>n.props['aria-label']==='Image color')!;
  expect(picker.props.value).toBe('#112233');
  picker.props.onChange({target:{value:'#abcdef'}});
  expect(onCommit.mock.calls[0][1](selected)).toMatchObject({tintColor:'#abcdef'});
  nodes.find(n=>n.type==='button'&&n.props.children==='Restore original color')!.props.onClick();
  expect(onCommit.mock.calls[1][1](selected).tintColor).toBeUndefined();
  expect(setAssetTint({...asset,locked:true},'#abcdef').tintColor).toBeUndefined();
  expect(setAssetTint(asset,'bad-color')).toBe(asset);
  expect(assetSvgWithTint({...asset,tintColor:'bad-color'})).toBe(asset.svg);
  expect(assetCssFilter(selected)).toBe('none');
  expect(resetAssetVisualStyle(selected).tintColor).toBeUndefined();
 });
});
