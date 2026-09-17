import {describe,it,expect,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SHAPE_CATALOG,shapeSvgBody} from './shapeGeometry';
import {ShapeControls,patchShape} from './ShapeControls';
import {makeShape} from './editorObjects';
import {EditorObjectView} from './EditorObjectView';
import {objectToSvg} from './export';
import {createBlankDocument,migrateDocument} from './model';
import {BioPlotStore,ObjectStateCommand} from './engine';
describe('geometric shapes',()=>{
 it('renders every geometry identically on canvas and in export',()=>{
  expect(SHAPE_CATALOG.length).toBeGreaterThanOrEqual(10);
  for(const item of SHAPE_CATALOG){
   const object={...makeShape(item.shape),fill:'#abcdef',stroke:'#123456',strokeWidth:6,lineStyle:'dotted' as const};
   const body=shapeSvgBody(object);
   expect(body).not.toMatch(/NaN|undefined/);expect(body).toContain('stroke-width="6"');expect(body).toContain('stroke-dasharray="1 5"');
   const canvas=renderToStaticMarkup(createElement(EditorObjectView,{object,selected:false,onPointerDown:vi.fn(),onContextMenu:vi.fn()}));
   expect(canvas).toContain(body);expect(objectToSvg(object)).toContain(body);
  }
 });
 it('keeps thick borders within small shapes and supports no fill and no border',()=>{
  const body=shapeSvgBody({...makeShape('rect'),width:12,height:12,strokeWidth:40});
  expect(body).toContain('width="0"');expect(body).not.toContain('width="-');
  expect(shapeSvgBody({...makeShape('triangle'),fill:'none',strokeWidth:0})).toContain('fill="none"');
  expect(makeShape('circle').width).toBe(makeShape('circle').height);
 });
 it('provides labeled controls and protects locked shapes',()=>{
  const object={...makeShape('rounded'),locked:true};
  expect(patchShape(object,object.id,{fill:'#000000'})).toBe(object);
  const html=renderToStaticMarkup(createElement(ShapeControls,{object,fa:false,onCommit:vi.fn()}));
  for(const label of ['Border width','Border color','Border style','Corner radius','No fill','Opacity','disabled'])expect(html).toContain(label);
 });
 it('retains geometry and styling through undo/redo and save/load',()=>{
  const doc=createBlankDocument(),before=makeShape('rect');doc.pages[0].objects=[before];
  const after={...before,shape:'star' as const,fill:'none',stroke:'#ff8800',strokeWidth:4,lineStyle:'dashed' as const};
  const store=new BioPlotStore(doc);store.dispatch(new ObjectStateCommand('Shape',[before],[after]));
  store.undo();expect(store.snapshot.pages[0].objects[0]).toEqual(before);store.redo();
  const saved=migrateDocument(JSON.parse(JSON.stringify(store.snapshot)));
  expect(saved.pages[0].objects[0]).toMatchObject(after);expect(objectToSvg(saved.pages[0].objects[0])).toContain('<polygon');
 });
});
