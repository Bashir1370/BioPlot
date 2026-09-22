import {describe,it,expect,vi} from 'vitest';
import {deleteOptimistically} from './optimisticDeletion';
function deferred(){let resolve!:()=>void;let reject!:(error:Error)=>void;const promise=new Promise<void>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
describe('optimistic project deletion',()=>{
 it('hides immediately while a slow server is still pending and blocks stale cards after success',async()=>{
  const request=deferred(),hidden=new Set<string>();
  const actions={hide:vi.fn(),remove:vi.fn(()=>request.promise),restore:vi.fn(),commit:vi.fn()};
  const task=deleteOptimistically('a',hidden,actions);
  expect(actions.hide).toHaveBeenCalledOnce();expect(hidden.has('a')).toBe(true);expect(actions.commit).not.toHaveBeenCalled();
  await deleteOptimistically('a',hidden,actions);expect(actions.remove).toHaveBeenCalledOnce();
  request.resolve();await task;expect(actions.commit).toHaveBeenCalledOnce();expect(hidden.has('a')).toBe(true);expect(actions.restore).not.toHaveBeenCalled();
 });
 it('restores a failed deletion without undoing another concurrent deletion and allows retry',async()=>{
  const a=deferred(),b=deferred(),hidden=new Set<string>();
  const restore=vi.fn();const actions={hide:vi.fn(),remove:()=>a.promise,restore,commit:vi.fn()};
  const first=deleteOptimistically('a',hidden,actions);
  const second=deleteOptimistically('b',hidden,{...actions,remove:()=>b.promise});
  a.reject(new Error('Offline'));await first;expect(restore).toHaveBeenCalledOnce();expect(hidden.has('a')).toBe(false);expect(hidden.has('b')).toBe(true);
  b.resolve();await second;
  await deleteOptimistically('a',hidden,{...actions,remove:async()=>{}});expect(hidden.has('a')).toBe(true);
 });
});
