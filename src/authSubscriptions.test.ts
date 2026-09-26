import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
const mock = vi.hoisted(() => ({listener: undefined as undefined | (() => void), getUser:vi.fn(), unsubscribe:vi.fn()}));
vi.mock('./supabaseClient',()=>({supabase:{auth:{getUser:mock.getUser,onAuthStateChange:(listener:()=>void)=>{mock.listener=listener;return {data:{subscription:{unsubscribe:mock.unsubscribe}}};}}}}));
import {subscribeAccountState} from './accountAuth';
import {subscribeAdminState} from './adminAuth';
beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();mock.getUser.mockResolvedValue({data:{user:null}});});
afterEach(()=>vi.useRealTimers());
for (const [name, subscribe] of [['account',subscribeAccountState],['admin',subscribeAdminState]] as const) {
 describe(name+' auth notification',()=>{
  it('defers Supabase calls until outside the auth lock and coalesces events',async()=>{
   const callback=vi.fn();const stop=subscribe(callback);
   mock.listener!();mock.listener!();
   expect(mock.getUser).not.toHaveBeenCalled();
   await vi.runAllTimersAsync();
   expect(mock.getUser).toHaveBeenCalledTimes(1);expect(callback).toHaveBeenCalledTimes(1);stop();
  });
  it('cancels pending work when the page unmounts',async()=>{
   const callback=vi.fn();const stop=subscribe(callback);mock.listener!();stop();
   await vi.runAllTimersAsync();expect(mock.getUser).not.toHaveBeenCalled();expect(callback).not.toHaveBeenCalled();expect(mock.unsubscribe).toHaveBeenCalled();
  });
 });
}
