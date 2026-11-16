// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({admin:false}));
vi.mock('./accountAuth',()=>({getAccountState:async()=>({user:{id:'signed-in',email:'private@example.com'},profile:{display_name:'زیبا'},isAdmin:state.admin}),subscribeAccountState:()=>()=>{},accountDisplayName:()=> 'زیبا',accountInitial:()=> 'Z',updateUserProfile:vi.fn()}));
vi.mock('./orders/orderRepository',()=>({getOrderInbox:async()=>[]}));
vi.mock('./persistence',()=>({projects:{list:async()=>[]},localProjects:{}}));
import {UserDashboard} from './UserDashboard';
describe('Dashboard sidebar for signed-in accounts',()=>{
 let host:HTMLDivElement,root:Root;
 beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);localStorage.setItem('bioplot-lang','fa');host=document.createElement('div');document.body.append(host);root=createRoot(host);});
 afterEach(async()=>{await act(async()=>root.unmount());host.remove();localStorage.clear();vi.unstubAllGlobals();});
 for(const admin of [false,true])it(`renders the three requested destinations and a working profile for ${admin?'admin':'customer'}`,async()=>{
  state.admin=admin;
  await act(async()=>root.render(<UserDashboard/>));
  const sidebar=host.querySelector('.workspace-sidebar')!;
  const links=Array.from(sidebar.querySelectorAll('nav>a,nav>button'));
  expect(links.map(el=>el.textContent)).toEqual(['خانه','پروفایل','لیست سفارش‌ها']);
  expect(links[0].getAttribute('href')).toBe('/');
  expect(links[2].getAttribute('href')).toBe('/orders');
  expect(sidebar.textContent).not.toContain('private@example.com');
  expect(sidebar.querySelector('.workspace-logo')?.textContent).toBe('BioPlot');
  await act(async()=> (links[1] as HTMLButtonElement).click());
  expect(host.querySelector('.workspace-profile form')).not.toBeNull();
  expect(links[1].getAttribute('aria-current')).toBe('page');
 });
});
