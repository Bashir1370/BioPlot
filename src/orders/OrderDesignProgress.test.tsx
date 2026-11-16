// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OrderDesignProgress} from './OrderDesignProgress';
import type {DesignOrder,OrderEvent} from './orderModel';
const now=Date.parse('2026-11-17T10:00:00Z');
const due=now+((1*24+2)*60+3)*60000;
const order={id:'order',status:'designing',quote_days:3} as DesignOrder;
const events=[{id:'consent',order_id:'order',actor_id:'customer',status:'accepted',created_at:new Date(now-60000).toISOString(),detail:{delivery_due_at:new Date(due).toISOString()}}] as OrderEvent[];
describe('Customer design countdown',()=>{
 let host:HTMLDivElement,root:Root;
 beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.useFakeTimers();vi.setSystemTime(now);host=document.createElement('div');document.body.append(host);root=createRoot(host);});
 afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.useRealTimers();vi.unstubAllGlobals();});
 it('shows Persian day/hour/minute values and updates without resetting after a refresh',async()=>{
  await act(async()=>root.render(<OrderDesignProgress fa order={order} events={events}/>));
  expect(Array.from(host.querySelectorAll('.design-countdown strong')).map(el=>el.textContent)).toEqual(['۰۱','۰۲','۰۳']);
  expect(host.textContent).toContain('از صبر و شکیبایی شما نهایت سپاس را داریم');
  await act(async()=>vi.advanceTimersByTimeAsync(60000));
  expect(host.querySelector('.design-countdown>div:last-child strong')?.textContent).toBe('۰۲');
  await act(async()=>root.render(<OrderDesignProgress fa order={{...order,updated_at:new Date().toISOString()}} events={events}/>));
  expect(host.querySelector('.design-countdown>div:last-child strong')?.textContent).toBe('۰۲');
 });
 it('shows an honest overdue update and disappears when files are delivered',async()=>{
  vi.setSystemTime(due+1);
  await act(async()=>root.render(<OrderDesignProgress fa order={order} events={events}/>));
  expect(host.querySelector('[role="timer"]')).toBeNull();
  expect(host.textContent).toContain('موعد اعلام‌شده فرا رسیده است');
  await act(async()=>root.render(<OrderDesignProgress fa order={{...order,status:'delivered'}} events={events}/>));
  expect(host.textContent).toBe('');
 });
});
