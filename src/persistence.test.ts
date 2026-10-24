import 'fake-indexeddb/auto';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {BrowserProjectRepository,IndexedDbProjectRepository,LocalProjectRepository,type ProjectRepository} from './persistence';
import {createBlankDocument,type BioPlotDocument} from './model';
vi.mock('./supabaseClient',()=>({supabase:{}}));
afterEach(()=>vi.unstubAllGlobals());
function memory(doc:BioPlotDocument|null):ProjectRepository{
 return {list:vi.fn(async()=>doc?[{id:doc.id,title:doc.title,updatedAt:doc.updatedAt}]:[]),load:vi.fn(async()=>doc),save:vi.fn(async(next)=>{doc=structuredClone(next);}),remove:vi.fn(async()=>{doc=null;})};
}
describe('browser persistence failover',()=>{
 it('reads and warms the newer fallback after a failed IndexedDB write',async()=>{
  const old={...createBlankDocument(),updatedAt:'2026-01-01T00:00:00.000Z'};
  const latest={...old,title:'Latest edit',updatedAt:'2026-01-02T00:00:00.000Z'};
  const primary=memory(old),fallback=memory(null),repo=new BrowserProjectRepository(fallback,primary);
  vi.mocked(primary.save).mockRejectedValueOnce(new Error('Disk full'));
  await repo.save(latest);
  expect(await repo.load(old.id)).toEqual(latest);
  expect((await repo.list())[0].title).toBe('Latest edit');
  expect(primary.save).toHaveBeenLastCalledWith(latest);
 });
 it('keeps IndexedDB projects available when fallback storage is blocked',async()=>{
  const doc=createBlankDocument(),primary=memory(doc),fallback=memory(null);
  vi.mocked(fallback.list).mockRejectedValue(new Error('Blocked'));
  vi.mocked(fallback.load).mockRejectedValue(new Error('Blocked'));
  const repo=new BrowserProjectRepository(fallback,primary);
  expect(await repo.list()).toHaveLength(1);
  expect(await repo.load(doc.id)).toEqual(doc);
 });
 it('returns the fallback even if cache repair also fails',async()=>{
  const doc=createBlankDocument(),primary=memory(null);
  vi.mocked(primary.load).mockRejectedValue(new Error('Unavailable'));
  vi.mocked(primary.save).mockRejectedValue(new Error('Unavailable'));
  expect(await new BrowserProjectRepository(memory(doc),primary).load(doc.id)).toEqual(doc);
 });
 it('reports a partial deletion instead of silently resurrecting an old copy',async()=>{
  const doc=createBlankDocument(),primary=memory(doc);
  vi.mocked(primary.remove).mockRejectedValue(new Error('Delete failed'));
  await expect(new BrowserProjectRepository(memory(doc),primary).remove(doc.id)).rejects.toThrow('Delete failed');
 });
 it('preserves version timestamps while warming either browser store',async()=>{
  const entries=new Map<string,string>();
  vi.stubGlobal('localStorage',{getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>entries.set(key,value)});
  const doc={...createBlankDocument(),updatedAt:'2026-01-01T00:00:00.000Z'};
  for(const repo of [new LocalProjectRepository(),new IndexedDbProjectRepository()]){
   await repo.save(doc);expect((await repo.load(doc.id))?.updatedAt).toBe(doc.updatedAt);
   await repo.remove(doc.id);expect(await repo.load(doc.id)).toBeNull();
  }
 });
});
