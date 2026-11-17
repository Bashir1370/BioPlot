// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {DesignOrder,OrderEvent,OrderFile,OrderStatus} from './orderModel';
const state=vi.hoisted(()=>({admin:true,record:null as DesignOrder|null,events:[] as OrderEvent[],files:[] as OrderFile[]}));
const api=vi.hoisted(()=>({transition:vi.fn(async(..._args:unknown[])=>{}),upload:vi.fn(async(..._args:unknown[])=>{})}));
vi.mock('../accountAuth',()=>({
 getAccountState:async()=>({user:{id:state.admin?'team':'customer'},profile:null,isAdmin:state.admin}),
 subscribeAccountState:()=>()=>{},accountDisplayName:()=> 'Admin',accountInitial:()=> 'A',
}));
vi.mock('../HomeHeader',()=>({HomeHeader:()=> <header data-testid="home-header"/>}));
vi.mock('../HomeFooter',()=>({HomeFooter:()=>null}));
vi.mock('./orderRepository',()=>({
 listOrders:async()=>[state.record],loadOrder:async()=>({order:state.record,files:state.files,messages:[],events:state.events}),
 markOrderRead:async()=>{},transitionOrder:api.transition,
 createOrder:vi.fn(),sendOrderMessage:vi.fn(),uploadOrderFile:api.upload,downloadOrderFile:vi.fn(),orderError:()=> 'Action failed',
}));
import {OrdersPage} from './OrdersPage';
const order:DesignOrder={id:'submitted-order',user_id:'customer',title:'Scientific pathway',kind:'figure',brief:{route:'idea',message:'Show the molecular pathway and its key components',audience:'',requirements:'',style:'',formats:['PNG']},requested_date:null,status:'submitted',quote_amount:null,quote_deposit_amount:null,quote_currency:null,quote_scope:null,quote_days:null,quote_revisions:null,revision_round:0,created_at:'2026-11-16T10:00:00Z',updated_at:'2026-11-16T10:00:00Z'};
describe('Order management from dashboard links',()=>{
 let host:HTMLDivElement,root:Root;
 beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);state.admin=true;state.record={...order};api.transition.mockReset().mockResolvedValue(undefined);api.upload.mockReset().mockResolvedValue(undefined);state.events=[];state.files=[];localStorage.setItem('bioplot-lang','fa');history.replaceState(null,'','/orders?id=submitted-order');host=document.createElement('div');document.body.append(host);root=createRoot(host);});
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
  expect(host.querySelector('.admin-order-tabs [aria-current=step]')?.textContent).toBe('ثبت درخواست');
  await act(async()=>button('تأیید درخواست')!.click());
  expect(api.transition).not.toHaveBeenCalled();
  await act(async()=>host.querySelector('.order-action-form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(api.transition).toHaveBeenCalledExactlyOnceWith(state.record,'reviewing','',undefined);
 });
 it('keeps management confirmation unavailable to customers and shows the same stages in English',async()=>{
  state.admin=false;localStorage.setItem('bioplot-lang','en');
  await act(async()=>root.render(<OrdersPage/>));
  expect(host.querySelector('.workspace-sidebar')).toBeNull();
  expect(host.querySelector('[data-testid="home-header"]')).not.toBeNull();
  expect(button('Confirm request')).toBeUndefined();
  expect(button('Cancel request')).toBeDefined();
  expect(Array.from(host.querySelectorAll('.admin-order-tabs button'),el=>el.textContent)).toEqual(['Request','Agreement','Design','Delivery','Review','Payment','Complete']);
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

 it('publishes the legacy order to Delivery and opens Revision or Payment when the customer responds',async()=>{
  state.record={...order,status:'accepted',quote_amount:100,quote_currency:'USD'};
  const changeStatus=(status:OrderStatus,note:string,created_at:string)=>{
   state.record={...state.record!,status,updated_at:created_at};
   state.events.push({id:String(state.events.length),created_at,order_id:order.id,actor_id:'team',status,detail:{note}});
  };
  api.transition.mockImplementation(async(...args:unknown[])=>{
   const [,status,note]=args as [DesignOrder,OrderStatus,string];
   changeStatus(status,note,status==='designing'?'2026-11-16T11:00:00Z':'2026-11-16T13:00:00Z');
  });
  api.upload.mockImplementation(async()=>{
   state.files=[{id:'drawing',order_id:order.id,uploader_id:'team',kind:'preview',name:'drawing.png',path:'drawing.png',size:7,created_at:'2026-11-16T12:00:00Z'}];
  });
  await act(async()=>root.render(<OrdersPage/>));
  const input=host.querySelector<HTMLInputElement>('.order-review-stage input[type=file]')!;
  expect(input).not.toBeNull();
  const preview=new File(['drawing'],'drawing.png',{type:'image/png'});
  Object.defineProperty(input,'files',{value:[preview]});
  await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
  const note=host.querySelector('textarea')!;
  const setValue=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!;
  await act(async()=>{setValue.call(note,'لطفاً نسخه را بررسی کنید.');note.dispatchEvent(new Event('input',{bubbles:true}));});
  await act(async()=>host.querySelector('form.order-review-stage')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(api.transition.mock.calls.map(args=>args.slice(1))).toEqual([['designing',''],['review','لطفاً نسخه را بررسی کنید.']]);
  expect(api.upload).toHaveBeenCalledWith(order.id,'team',preview,'preview');
  const current=()=>host.querySelector('.admin-order-tabs [aria-current=step]')?.textContent;
  expect(current()).toBe('تحویل');
  expect(host.textContent).toContain('drawing.png');
  expect(host.textContent).toContain('لطفاً نسخه را بررسی کنید.');
  expect(host.querySelector('.order-detail-side')).toBeNull();
  changeStatus('revision_requested','اصلاح عنوان','2026-11-16T14:00:00Z');
  await act(async()=>window.dispatchEvent(new Event('focus')));
  expect(current()).toBe('بازبینی');
  expect(host.textContent).toContain('اصلاح عنوان');
  expect(host.textContent).not.toContain('لطفاً نسخه را بررسی کنید.');
  expect(button('پرداخت مالی')?.disabled).toBe(true);
  changeStatus('designing','','2026-11-16T15:00:00Z');
  await act(async()=>window.dispatchEvent(new Event('focus')));
  expect(current()).toBe('بازبینی');
  changeStatus('review','نسخه دوم','2026-11-16T16:00:00Z');
  await act(async()=>window.dispatchEvent(new Event('focus')));
  changeStatus('approved','','2026-11-16T17:00:00Z');
  await act(async()=>window.dispatchEvent(new Event('focus')));
  expect(current()).toBe('پرداخت مالی');
  expect(host.textContent).not.toContain('اصلاح عنوان');
 });
});
