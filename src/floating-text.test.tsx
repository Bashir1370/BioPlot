import {describe,it,expect,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {FloatingTextControls,patchTextItem} from './FloatingTextControls';
import {makeText,makeTagLabel} from './editorObjects';
import {EditorObjectView} from './EditorObjectView';
import {objectToSvg,documentToSvg} from './export';
import {createBlankDocument,migrateDocument} from './model';
import {BioPlotStore,ObjectStateCommand} from './engine';
describe('floating text editor',()=>{
 it('offers font, size, content and frame controls with Persian fonts',()=>{
  const html=renderToStaticMarkup(createElement(FloatingTextControls,{object:makeTagLabel(),fa:false,onCommit:vi.fn()}));
  for(const text of ['Font size','Text content','Noto Naskh Arabic','Lalezar','Frame shape','Frame fill','Frame border','Rounded rectangle'])expect(html).toContain(text);
 });
 it('guards locked and unrelated objects',()=>{
  const object=makeText();expect(patchTextItem({...object,locked:true},object.id,{fontSize:30})).toMatchObject({fontSize:object.fontSize});
  expect(patchTextItem(object,'other',{fontSize:30})).toBe(object);
 });
 it('renders frame shapes and multiline text in canvas and export',()=>{
  for(const frameShape of ['rect','rounded','circle'] as const){
   const object={...makeTagLabel(),frameShape,text:'سلام\nBioPlot',fontFamily:'Lalezar',background:'#123456'};
   const svg=objectToSvg(object);
   expect(svg).toContain(frameShape==='circle'?'<ellipse':`rx="${frameShape==='rect'?0:8}"`);
   expect(svg).toContain('<tspan');expect(svg).toContain('#123456');expect(svg).toContain('Lalezar');
   const html=renderToStaticMarkup(createElement(EditorObjectView,{object,selected:false,onPointerDown:vi.fn(),onContextMenu:vi.fn()}));
   expect(html).toContain(`border-radius:${frameShape==='circle'?'50%':frameShape==='rect'?'0':'8px'}`);
  }
 });
 it('retains text styles through history and saved documents and embeds new export fonts',()=>{
  const doc=createBlankDocument(),object=makeTagLabel();doc.pages[0].objects=[object];
  const store=new BioPlotStore(doc);
  store.dispatch(new ObjectStateCommand('Text style',[object],[{...object,fontFamily:'Lalezar',fontSize:28,frameShape:'circle',background:'#abcdef'}]));
  store.undo();expect(store.snapshot.pages[0].objects[0]).toEqual(object);
  store.redo();const saved=migrateDocument(JSON.parse(JSON.stringify(store.snapshot)));
  expect(saved.pages[0].objects[0]).toMatchObject({fontFamily:'Lalezar',fontSize:28,frameShape:'circle'});
  const svg=documentToSvg(saved);expect(svg).toContain('data:font/woff2;base64,');expect(svg).toContain('font-family:');
 });
});
