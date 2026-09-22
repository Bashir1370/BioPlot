import {describe,it,expect,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createBlankDocument} from './model';
import {WorkspaceRepository} from './workspaceRepository';
function setup(){
 const a={...createBlankDocument(),id:'a',ownerId:'alice',updatedAt:'2026-09-18T12:00:00Z'};
 const b={...createBlankDocument(),id:'b',ownerId:'bob'};
 const guest={...createBlankDocument(),id:'g',ownerId:undefined};
 const docs=[a,b,guest];
 const local={list:vi.fn(async()=>docs.map(d=>({id:d.id,title:d.title,updatedAt:d.updatedAt}))),load:vi.fn(async(id:string)=>docs.find(d=>d.id===id)||null),save:vi.fn(async()=>{}),remove:vi.fn(async()=>{})};
 const cloud={list:vi.fn(async()=>[]),load:vi.fn(async()=>null as typeof a|null),save:vi.fn(async()=>{}),remove:vi.fn(async()=>{})};
 const session=vi.fn(async()=>({data:{session:{user:{id:'alice'}} as {user:{id:string}}|null},error:null}));
 const repo=new WorkspaceRepository(local,cloud,{auth:{getSession:session}} as unknown as SupabaseClient);
 return {repo,local,cloud,session,a,b,guest};
}
describe('account workspace storage',()=>{
 it('shows only own cached figures for an account',async()=>{const {repo}=setup();expect((await repo.list()).map(r=>r.id)).toEqual(['a']);expect(await repo.load('b')).toBeNull();expect(await repo.load('g')).toBeNull();});
 it('shows only anonymous drafts to guests',async()=>{const {repo,session,cloud}=setup();session.mockResolvedValue({data:{session:null},error:null});expect((await repo.list()).map(r=>r.id)).toEqual(['g']);expect(await repo.load('a')).toBeNull();expect(cloud.load).not.toHaveBeenCalled();});
 it('saves ownership and retains a local copy when cloud save fails',async()=>{const {repo,local,cloud,guest}=setup();cloud.save.mockRejectedValue(new Error('Offline'));await expect(repo.save(guest)).rejects.toThrow('Offline');expect(local.save).toHaveBeenCalledWith(expect.objectContaining({ownerId:'alice'}));});
 it('rejects saving a loaded document after an account switch',async()=>{const {repo,session,local}=setup();const doc=await repo.load('a');session.mockResolvedValue({data:{session:{user:{id:'bob'}}},error:null});await expect(repo.save(doc!)).rejects.toThrow('Account changed');expect(local.save).not.toHaveBeenCalled();});
 it('prefers newer unsynced local work over an older cloud version',async()=>{const {repo,cloud,a}=setup();cloud.load.mockResolvedValue({...a,updatedAt:'2026-01-01T00:00:00Z'});expect((await repo.load('a'))?.updatedAt).toBe(a.updatedAt);});
 it('does not hide cloud-list failures as a successful empty list',async()=>{const {repo,cloud}=setup();cloud.list.mockRejectedValue(new Error('Offline'));await expect(repo.list()).rejects.toThrow('Offline');});
 it('deletes the account project from cloud and its own local cache',async()=>{const {repo,local,cloud}=setup();await repo.remove('a');expect(cloud.remove).toHaveBeenCalledWith('a');expect(local.remove).toHaveBeenCalledWith('a');});
 it('preserves the local project when cloud deletion fails',async()=>{const {repo,local,cloud}=setup();cloud.remove.mockRejectedValue(new Error('Offline'));await expect(repo.remove('a')).rejects.toThrow('Offline');expect(local.remove).not.toHaveBeenCalled();});
 it('deletes guest drafts locally without deleting account caches',async()=>{const {repo,session,local,cloud}=setup();session.mockResolvedValue({data:{session:null},error:null});await repo.remove('g');expect(local.remove).toHaveBeenCalledWith('g');local.remove.mockClear();await repo.remove('a');expect(local.remove).not.toHaveBeenCalled();expect(cloud.remove).not.toHaveBeenCalled();});
});
