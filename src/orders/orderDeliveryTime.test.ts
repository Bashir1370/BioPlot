import {describe,it,expect} from 'vitest';
import {designWindow,remainingDesignTime} from './orderDeliveryTime';
import type {DesignOrder,OrderEvent} from './orderModel';
const order={quote_days:3,updated_at:'2026-12-20T00:00:00Z'} as DesignOrder;
const event=(status:OrderEvent['status'],created_at:string,detail:Record<string,unknown>={}):OrderEvent=>({id:status,order_id:'order',actor_id:'customer',status,created_at,detail});
describe('Agreed design delivery window',()=>{
 it('uses the saved server deadline regardless of later updates and restarts',()=>{
  const events=[event('accepted','2026-11-17T10:00:00Z',{delivery_due_at:'2026-11-20T10:00:00Z',days:3}),event('designing','2026-11-18T14:00:00Z')];
  expect(designWindow(order,events)).toEqual({start:Date.parse('2026-11-17T10:00:00Z'),due:Date.parse('2026-11-20T10:00:00Z')});
 });
 it('uses historical accepted terms and never invents a start time without events',()=>{
  expect(designWindow(order,[event('accepted','2026-11-17T10:00:00Z',{days:2})])?.due).toBe(Date.parse('2026-11-19T10:00:00Z'));
  expect(designWindow(order,[])).toBeNull();
  expect(designWindow(order,[event('accepted','bad-date')])).toBeNull();
 });
 it('restarts the window only after a newly accepted proposal',()=>{
  expect(designWindow(order,[event('accepted','2026-11-17T10:00:00Z',{days:2}),event('accepted','2026-11-20T10:00:00Z',{days:1})])?.due).toBe(Date.parse('2026-11-21T10:00:00Z'));
 });
 it('splits remaining time into days hours and minutes and clamps at the deadline',()=>{
  expect(remainingDesignTime(90061000,0)).toEqual({days:1,hours:1,minutes:2,overdue:false});
  expect(remainingDesignTime(60000,60000)).toEqual({days:0,hours:0,minutes:0,overdue:true});
  expect(remainingDesignTime(60000,90000)).toEqual({days:0,hours:0,minutes:0,overdue:true});
 });
});
