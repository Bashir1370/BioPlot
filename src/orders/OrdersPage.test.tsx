// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {DesignOrder} from './orderModel';
const state=vi.hoisted(()=>({admin:true,record:null as DesignOrder|null}));
const api=vi.hoisted(()=>({transition:vi.fn(async()=>{}),upload:vi.fn(async()=>{})}));
vi.mock('../accountAuth',()=>({
 getAccountState:async()=>({user:{id:state.admin?'team':'customer'},profile:null,isAdmin:state.admin}),
 subscribeAccountState:()=>()=>{},accountDisplayName:()=> 'Admin',accountInitial:()=> 'A',
}));
vi.mock('../HomeHeader',()=>({HomeHeader:()=> <header data-testid="home-header"/>}));
vi.mock('../HomeFooter',()=>({HomeFooter:()=>null}));
vi.mock('./orderRepository',()=>({
 listOrders:async()=>[state.record],loadOrder:async()=>({order:state.record,files:[],messages:[],events:[]}),
 markOrderRead:async()=>{},transitionOrder:api.transition,
 createOrder:vi.fn(),sendOrderMessage:vi.fn(),uploadOrderFile:api.upload,downloadOrderFile:vi.fn(),orderError:()=> 'Action failed',
}));
import {OrdersPage} from './OrdersPage';
const order:DesignOrder={id:'submitted-order',user_id:'customer',title:'Scientific pathway',kind:'figure',brief:{route:'idea',message:'Show the molecular pathway and its key components',audience:'',requirements:'',style:'',formats:['PNG']},requested_date:null,status:'submitted',quote_amount:null,quote_deposit_amount:null,quote_currency:null,quote_scope:null,quote_days:null,quote_revisions:null,revision_round:0,created_at:'2026-11-16T10:00:00Z',updated_at:'2026-11-16T10:00:00Z'};
describe('Order management from dashboard links',()=>{
 let host:HTMLDivElement,root:Root;
 beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);state.admin=true;state.record={...order};api.transition.mockClear();localStorage.setItem('bioplot-lang','fa');history.replaceState(null,'','/orders?id=submitted-order');host=document.createElement('div');document.body.append(host);root=createRoot(host);});
 afterEach(async()=>{await act(async()=>root.unmount());host.remove();localStorage.clear();vi.unstubAllGlobals();});
 const button=(label:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent===label);
 it('lets a verified admin confirm a submitted request from the regular order URL',async()=>{
  await act(async()=>root.render(<OrdersPage/>));
  expect(host.querySelector('.order-request-summary')).not.toBeNull();
  expect(host.querySelector('.workspace-sidebar')).not.toBeNull();
  expect(host.querySelector('[data-testid="home-header"]')).toBeNull();
  expect(host.querySelector('.workspace-order-link')?.getAttribute('href')).toBe('/admin/orders');
  expect(button('لغو درخواست')).toBeDefined();
  expect(button('تأیید درخواست')).toBeDefined();
  expect(Array.from(host.querySelectorAll('.order-progress li>span')).map(el=>el.textContent)).toEqual(['۱','۲','۳','۴','۵','۶','۷']);
  await act(async()=>button('تأیید درخواست')!.click());
  expect(api.transition).not.toHaveBeenCalled();
  await act(async()=>host.querySelector('.order-action-form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(api.transition).toHaveBeenCalledExactlyOnceWith(state.record,'reviewing','',undefined);
 });
 it('keeps management confirmation unavailable to customers and uses English step numbers in English',async()=>{
  state.admin=false;localStorage.setItem('bioplot-lang','en');
  await act(async()=>root.render(<OrdersPage/>));
  expect(host.querySelector('.workspace-sidebar')).toBeNull();
  expect(host.querySelector('[data-testid="home-header"]')).not.toBeNull();
  expect(button('Confirm request')).toBeUndefined();
  expect(button('Cancel request')).toBeDefined();
  expect(Array.from(host.querySelectorAll('.order-progress li>span')).map(el=>el.textContent)).toEqual(['1','2','3','4','5','6','7']);
 });
 it('retains admin navigation between detail and list and supports collapsing and mobile Escape',async()=>{
  await act(async()=>root.render(<OrdersPage admin/>));
  await act(async()=>host.querySelector<HTMLButtonElement>('.workspace-collapse')!.click());
  expect(host.querySelector('.workspace.is-collapsed')).not.toBeNull();
  await act(async()=>button('فهرست سفارش‌ها')!.click());
  expect(host.querySelector('.workspace-sidebar')).not.toBeNull();
  expect(host.querySelector('.order-list')).not.toBeNull();
  expect(host.querySelector('.workspace-sidebar a[href="/dashboard?tab=profile"]')).not.toBeNull();
  await act(async()=>host.querySelector<HTMLButtonElement>('.workspace-mobile')!.click());
  expect(host.querySelector('.workspace-sidebar.is-open')).not.toBeNull();
  await act(async()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})));
  expect(host.querySelector('.workspace-sidebar.is-open')).toBeNull();
 });

 it('opens the design uploader directly for legacy accepted orders and starts design before uploading',async()=>{
  state.record={...order,status:'accepted'};
  await act(async()=>root.render(<OrdersPage/>));
  const input=host.querySelector<HTMLInputElement>('.order-review-stage input[type=file]')!;
  expect(input).not.toBeNull();
  expect(button('شروع طراحی')).toBeUndefined();
  expect(host.querySelector('.order-detail-view>.order-request-summary')).toBeNull();
  const preview=new File(['drawing'],'drawing.png',{type:'image/png'});
  Object.defineProperty(input,'files',{value:[preview]});
  await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
  expect(api.transition).toHaveBeenCalledWith(state.record,'designing','');
  expect(api.upload).toHaveBeenCalledWith(order.id,'team',preview,'preview');
  expect(api.transition.mock.invocationCallOrder[0]).toBeLessThan(api.upload.mock.invocationCallOrder[0]);
 });

});
