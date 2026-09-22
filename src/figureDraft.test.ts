import {afterEach,describe,expect,it,vi} from 'vitest';
import {createBlankDocument} from './model';
import {figureContent,openFigureDraft,readFigureDraft,clearFigureDraft} from './figureDraft';

afterEach(()=>vi.unstubAllGlobals());
describe('unsaved figure lifecycle',()=>{
 it('keeps navigation drafts outside persistent project storage until edited',()=>{
  const entries=new Map<string,string>();
  vi.stubGlobal('sessionStorage',{setItem:(key:string,value:string)=>entries.set(key,value),getItem:(key:string)=>entries.get(key)??null,removeItem:(key:string)=>entries.delete(key)});
  vi.stubGlobal('window',{location:{href:''}});
  const doc=createBlankDocument();doc.metadata.locale='fa';
  openFigureDraft(doc);
  expect(window.location.href).toBe(`/editor?draft=${encodeURIComponent(doc.id)}`);
  expect(readFigureDraft(doc.id)).toEqual(doc);
  // Reading twice is safe under React StrictMode and refresh.
  expect(readFigureDraft(doc.id)).toEqual(doc);
  clearFigureDraft(doc.id);
  expect(readFigureDraft(doc.id)).toBeNull();
 });
 it('does not treat navigation, language, timestamps or export preferences as edits',()=>{
  const doc=createBlankDocument();const before=figureContent(doc);
  doc.activePageId='another-page';doc.metadata.locale='fa';doc.updatedAt='later';doc.metadata.lastExportDpi=600;
  expect(figureContent(doc)).toBe(before);
 });
 it('detects figure names and canvas changes even without any objects',()=>{
  const doc=createBlankDocument();const before=figureContent(doc);
  doc.title='My research';expect(figureContent(doc)).not.toBe(before);
  const renamed=figureContent(doc);doc.pages[0].width=1200;
  expect(figureContent(doc)).not.toBe(renamed);
 });
 it('detects deleting the last object so existing figures can be cleared',()=>{
  const doc=createBlankDocument();doc.pages[0].objects.push({id:'object'} as never);
  const before=figureContent(doc);doc.pages[0].objects=[];
  expect(figureContent(doc)).not.toBe(before);
 });
});
