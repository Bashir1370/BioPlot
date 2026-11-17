// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({admin:false,deleted:vi.fn(async()=>{}),inbox:[] as {id:string;title:string;status:string;unread_count:number;last_message_at:null;last_message_body:null}[]}));
vi.mock('./accountAuth',()=>({getAccountState:async()=>({user:{id:'signed-in',email:'private@example.com'},profile:{display_name:'زیبا'},isAdmin:state.admin}),subscribeAccountState:()=>()=>{},accountDisplayName:()=> 'زیبا',accountInitial:()=> 'Z',updateUserProfile:vi.fn()}));
vi.mock('./orders/orderRepository',()=>({getOrderInbox:async()=>state.inbox,deleteOrder:state.deleted}));
vi.mock('./persistence',()=>({projects:{list:async()=>[]},localProjects:{}}));
import {UserDashboard} from './UserDashboard';
describe('Dashboard sidebar for signed-in accounts',()=>{
 let host:HTMLDivElement,root:Root;
 beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);localStorage.setItem('bioplot-lang','fa');history.replaceState(null,'','/dashboard');host=document.createElement('div');document.body.append(host);root=createRoot(host);});
 afterEach(async()=>{await act(async()=>root.unmount());host.remove();localStorage.clear();vi.unstubAllGlobals();});
 for(const admin of [false,true])it(`renders the requested destinations and a working profile for ${admin?'admin':'customer'}`,async()=>{
  state.admin=admin;
  await act(async()=>root.render(<UserDashboard/>));
  const sidebar=host.querySelector('.workspace-sidebar')!;
  const links=Array.from(sidebar.querySelectorAll('nav>a,nav>button'));
  expect(links.map(el=>el.textContent)).toEqual(admin?['خانه','پروفایل','لیست سفارش‌ها']:['خانه','پروفایل','لیست سفارش‌ها','ثبت سفارش جدید']);
  expect(links[0].getAttribute('href')).toBe('/');
  expect(links[2].getAttribute('href')).toBe(admin?'/admin/orders':'/orders');
  if(!admin){
   expect(links[3].getAttribute('href')).toBe('/orders?new=1');
   expect(links[3].getAttribute('aria-label')).toBe('ثبت سفارش جدید');
  }else{
   expect(host.querySelector('a[href="/orders?new=1"]')).toBeNull();
   expect(host.textContent).toContain('هنوز سفارشی از کاربران دریافت نشده است.');
   expect(host.textContent).not.toContain('هنوز درخواست طراحی ثبت نکرده‌اید.');
  }
  expect(sidebar.textContent).not.toContain('private@example.com');
  expect(sidebar.querySelector('.workspace-logo')?.textContent).toBe('BioPlot');
  await act(async()=> (links[1] as HTMLButtonElement).click());
  expect(host.querySelector('.workspace-profile form')).not.toBeNull();
  expect(links[1].getAttribute('aria-current')).toBe('page');
 });
 it('opens Profile from the shared order-sidebar link',async()=>{
  state.admin=true;history.replaceState(null,'','/dashboard?tab=profile');
  await act(async()=>root.render(<UserDashboard/>));
  expect(host.querySelector('.workspace-profile form')).not.toBeNull();
  expect(host.querySelector('.workspace-sidebar [aria-current="page"]')?.textContent).toBe('پروفایل');
 });

 it('offers confirmed order deletion only to administrators',async()=>{
  state.inbox=[{id:'order-1',title:'Test order',status:'submitted',unread_count:0,last_message_at:null,last_message_body:null}];state.admin=false;
  await act(async()=>root.render(<UserDashboard/>));
  expect(host.querySelector('.workspace-order-delete')).toBeNull();
  await act(async()=>root.unmount());root=createRoot(host);state.admin=true;
  await act(async()=>root.render(<UserDashboard/>));
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
  const button=host.querySelector<HTMLButtonElement>('.workspace-order-delete')!;
  expect(button.closest('a')).toBeNull();
  await act(async()=>button.click());expect(state.deleted).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);await act(async()=>button.click());
  expect(state.deleted).toHaveBeenCalledWith('order-1');expect(host.querySelector('.workspace-order-row')).toBeNull();
  confirm.mockRestore();state.inbox=[];
 });

});
