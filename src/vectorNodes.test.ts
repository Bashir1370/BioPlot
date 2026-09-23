import { describe, expect, it } from 'vitest';
import {parsePath,pathString,pathHandles,deletePathNode,movePathHandle,insertPathNode,primitivePath} from './vectorNodes';
import {BioPlotStore,ObjectStateCommand} from './engine';
import {activePage,createBlankDocument,migrateDocument,type AssetObject} from './model';
import {documentToSvg} from './export';
const rect=()=>parsePath('M0 0H100V80H0Z');
describe('editable SVG path geometry',()=>{
  it('turns a four-vertex rectangle into a three-vertex closed triangle',()=>{const path=deletePathNode(rect(),2);expect(pathString(path)).toBe('M0 0 L100 0 L0 80 Z');expect(deletePathNode(path,1)).toBe(path);});
  it('promotes the following vertex when the first node is deleted',()=>{expect(pathString(deletePathNode(rect(),0))).toBe('M100 0 L100 80 L0 80 Z');});
  it('normalizes relative paths, shorthand, exponents and implicit line commands',()=>{expect(pathString(parsePath('m1e1 20 10 0 v10 h-10 z'))).toBe('M10 20 L20 20 L20 30 L10 30 Z');expect(parsePath('M0 0q10 10 20 0t20 0')[2]).toEqual({command:'Q',values:[30,-10,40,0]});expect(parsePath('M0 0c1 2 3 4 5 6s7 8 9 10')[2]).toEqual({command:'C',values:[7,8,12,14,14,16]});});
  it('accepts compact arc flags and does not treat radii/flags as node coordinates',()=>{const p=parsePath('M0 0a10 20 0 0110 20');expect(p[1]).toEqual({command:'A',values:[10,20,0,0,1,10,20]});expect(pathHandles(p)).toHaveLength(2);});
  it('retains curves when moving handles',()=>{const p=parsePath('M0 0C10 20 30 40 50 60');const h=pathHandles(p)[1];const next=movePathHandle(p,h,12,22);expect(next[1].values).toEqual([12,22,30,40,50,60]);expect(p[1].values[0]).toBe(10);});
  it('splits Bézier curves without changing their shape',()=>{expect(pathString(insertPathNode(parsePath('M0 0C0 100 100 100 100 0'),0))).toBe('M0 0 C0 50 25 75 50 75 C75 75 100 50 100 0');});
  it('protects separate subpaths and open minimums',()=>{const p=parsePath('M0 0L1 1 M10 10L20 20L30 30Z');expect(deletePathNode(p,0)).toBe(p);expect(deletePathNode(p,3)).toBe(p);});
  it('rejects incomplete paths instead of writing corrupted geometry',()=>{for(const d of ['M0','L0 0','M0 0R1 2','M0 0A1 1 0 3 0 10 10','M0 0 Z 3 4'])expect(()=>parsePath(d)).toThrow();});
  it('converts rectangles including inherited default coordinates',()=>{const e={localName:'rect',getAttribute:(key:string)=>({width:'100',height:'80'}[key]??null)} as unknown as Element;expect(pathHandles(parsePath(primitivePath(e)!))).toHaveLength(4);});
});
it('persists an edited SVG and supports project undo/redo and export',()=>{
  const document=createBlankDocument();const asset:AssetObject={id:'svg',type:'asset',name:'Template',assetId:'template',svg:'<svg viewBox="0 0 100 80"><rect width="100" height="80"/></svg>',colors:[],x:0,y:0,width:100,height:80,rotation:0,opacity:1};
  activePage(document).objects=[asset];const store=new BioPlotStore(document),next={...asset,svg:`<svg viewBox="0 0 100 80"><path d="${pathString(deletePathNode(rect(),2))}"/></svg>`};
  store.dispatch(new ObjectStateCommand('Edit SVG components',[asset],[next]));expect(documentToSvg(store.snapshot)).toContain('M0 0 L100 0 L0 80 Z');store.undo();expect(activePage(store.snapshot).objects[0]).toEqual(asset);store.redo();expect((activePage(migrateDocument(JSON.parse(JSON.stringify(store.snapshot)))).objects[0] as AssetObject).svg).toBe(next.svg);
});
