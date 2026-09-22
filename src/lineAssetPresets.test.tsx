import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect,vi} from 'vitest';
import {assetToObject,type ScientificAsset} from './assets';
import {applyAssetPreset,applyConfiguredAssetPreset,assetSvgWithTint,LINE_ASSET_PRESET_COLORS} from './assetStyling';
import {EditorObjectView} from './EditorObjectView';
import {objectToSvg} from './export';
import {createBlankDocument,migrateDocument} from './model';
import {BioPlotStore,ObjectStateCommand} from './engine';

const source='<svg viewBox="0 0 300 100"><image href="data:image/png;base64,iVBORw0KGgo=" width="300" height="100"/></svg>';
// Search and library insertions use assetToObject, not the Lines-only shortcut.
const arrow=assetToObject({id:'search-arrow',name:'Arrow',category:'Lines & Arrows',svg:source,colorSlots:[]} as unknown as ScientificAsset);
describe('color presets on arrows inserted from search',()=>{
 it.each(Object.entries(LINE_ASSET_PRESET_COLORS))('renders %s in canvas, thumbnail and export', (id,color)=>{
  const colored=applyAssetPreset(arrow,id);
  expect(arrow.lineAsset).toBe(true);
  expect(colored.svg).toBe(source);
  expect(colored.tintColor).toBe(color);
  const thumbnail=applyAssetPreset({...arrow,id:arrow.id+'-preview'},id);
  const canvas=renderToStaticMarkup(createElement(EditorObjectView,{object:colored,selected:true,onPointerDown:vi.fn(),onContextMenu:vi.fn()}));
  for(const output of [assetSvgWithTint(thumbnail),canvas,objectToSvg(colored)]){
   expect(output).toContain('flood-color="'+color+'"');
   expect(output).toContain('in2="SourceGraphic" operator="in"');
   expect(output).toContain('data:image/png;base64,');
  }
  expect(assetSvgWithTint(thumbnail)).not.toBe(assetSvgWithTint(colored));
 });
 it('switches colors without stacking filters and restores original artwork',()=>{
  const blue=applyAssetPreset(applyAssetPreset(arrow,'pink'),'blue');
  expect(assetSvgWithTint(blue).match(/<filter /g)).toHaveLength(1);
  const restored=applyAssetPreset(blue,'original');
  expect(restored.tintColor).toBeUndefined();expect(restored.svg).toBe(source);
 });
 it('uses exact alpha tint for admin-configured line presets too',()=>{
  const next=applyConfiguredAssetPreset(arrow,{id:'custom',label:'Custom',kind:'tint',color:'#123456'},source);
  expect(next.tintColor).toBe('#123456');expect(next.svg).toBe(source);
  const original=applyConfiguredAssetPreset(next,{id:'original',label:'Original',kind:'original'},source);
  expect(original.tintColor).toBeUndefined();expect(original.svg).toBe(source);
 });
 it('preserves chosen preset through history and saved document migration',()=>{
  const doc=createBlankDocument();doc.pages[0].objects=[arrow];const store=new BioPlotStore(doc);
  store.dispatch(new ObjectStateCommand('Blue preset',[arrow],[applyAssetPreset(arrow,'blue')]));
  store.undo();expect(store.snapshot.pages[0].objects[0]).not.toHaveProperty('tintColor');
  store.redo();const restored=migrateDocument(JSON.parse(JSON.stringify(store.snapshot)));
  expect(objectToSvg(restored.pages[0].objects[0])).toContain('flood-color="#2563eb"');
 });
 it('does not change a locked line asset',()=>{
  const locked={...arrow,locked:true};
  expect(applyAssetPreset(locked,'blue')).toBe(locked);
  expect(applyConfiguredAssetPreset(locked,{id:'red',label:'Red',kind:'tint',color:'#ff0000'})).toBe(locked);
 });
});
