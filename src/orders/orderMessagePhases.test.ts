import {describe,it,expect} from 'vitest';
import {groupOrderMessages} from './orderMessagePhases';
import type {DesignOrder,OrderEvent,OrderMessage} from './orderModel';
const order={id:'order',status:'designing',created_at:'2026-11-17T10:00:00Z',updated_at:'2026-11-17T12:00:00Z'} as DesignOrder;
const event=(id:string,status:OrderEvent['status'],hour:number):OrderEvent=>({id,order_id:'order',actor_id:'team',status,detail:{},created_at:`2026-11-17T${String(hour).padStart(2,'0')}:00:00Z`});
const message=(id:string,hour:number):OrderMessage=>({id,order_id:'order',author_id:'customer',body:id,created_at:`2026-11-17T${String(hour).padStart(2,'0')}:00:00Z`});
describe('Messages stay in their order stage',()=>{
 it('keeps request and quote messages out of design, including the exact transition boundary',()=>{
  const result=groupOrderMessages(order,[event('request','submitted',10),event('quote','quoted',11),event('consent','accepted',12),event('design','designing',12)],[message('request-message',10),message('quote-message',11),message('design-message',12)]);
  expect(result.current.messages.map(m=>m.id)).toEqual(['design-message']);
  expect(result.current.events.map(e=>e.id)).toEqual(['consent','design']);
  expect(result.previous.map(p=>p.messages.map(m=>m.id))).toEqual([['request-message'],['quote-message']]);
 });
 it('does not resurface messages from an earlier design round after a revision',()=>{
  const result=groupOrderMessages(order,[event('design1','designing',11),event('preview','review',12),event('revisions','revision_requested',13),event('design2','designing',14)],[message('old-design',11),message('review-comment',13),message('new-design',14)]);
  expect(result.current.id).toBe('design2');expect(result.current.messages.map(m=>m.id)).toEqual(['new-design']);
  expect(result.previous.flatMap(p=>p.messages).map(m=>m.id)).toEqual(['old-design','review-comment']);
 });
 it('keeps review and revision notes together until settlement',()=>{
  const result=groupOrderMessages({...order,status:'revision_requested'},[event('preview','review',11),event('revision','revision_requested',12)],[message('review-message',11)]);
  expect(result.current.stage).toBe(3);expect(result.current.events).toHaveLength(2);expect(result.current.messages).toHaveLength(1);
 });
 it('supports historical records without events without losing their messages',()=>{
  expect(groupOrderMessages(order,[],[message('legacy',10)]).current.messages).toHaveLength(1);
 });
 it('sorts timestamp offsets by time and retains messages preceding the first known event',()=>{
  const earlier={...message('old',10),created_at:'2026-11-17T12:30:00+03:30'};
  const result=groupOrderMessages(order,[event('design','designing',12)],[message('new',13),earlier]);
  expect(result.previous[0].messages.map(m=>m.id)).toEqual(['old']);
  expect(result.current.messages.map(m=>m.id)).toEqual(['new']);
 });
});
