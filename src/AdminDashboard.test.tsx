// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {UserDashboard} from './UserDashboard';
const {auth,inbox,projectsList}=vi.hoisted(()=>({auth:vi.fn(),inbox:vi.fn(),projectsList:vi.fn()}));
vi.mock('./accountAuth',()=>({getAccountState:auth,subscribeAccountState:()=>()=>{},accountDisplayName:()=> 'Admin',accountInitial:()=> 'A',signOutUser:vi.fn(),updateUserProfile:vi.fn()}));
vi.mock('./orders/orderRepository',()=>({getOrderInbox:inbox}));
vi.mock('./persistence',()=>({projects:{list:projectsList},localProjects:{list:vi.fn()}}));
describe('Role-specific dashboard',()=>{
 let host:HTMLDivElement,root:Root;
 beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);host=document.createElement('div');document.body.append(host);root=createRoot(host);localStorage.setItem('bioplot-lang','fa');projectsList.mockReset().mockResolvedValue([]);inbox.mockReset();});
 afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
 it('shows new customer requests and skips personal figure loading for admins',async()=>{
  auth.mockResolvedValue({user:{id:'admin'},profile:null,isAdmin:true});
  inbox.mockResolvedValue([{id:'request-1',title:'New customer figure',status:'submitted',updated_at:'2026-11-16T10:00:00Z',last_message_at:null,last_message_author_id:null,last_message_body:null,unread_count:0}]);
  await act(async()=>root.render(<UserDashboard/>));
  expect(host.textContent).toContain('مرکز مدیریت سفارش‌ها');expect(host.textContent).toContain('سفارش جدید منتظر بررسی');
  expect(host.querySelector('a[href="/admin/orders?id=request-1"]')).not.toBeNull();
  expect(host.textContent).not.toContain('شکل‌های من');expect(host.textContent).not.toContain('ثبت درخواست طراحی');
  expect(projectsList).not.toHaveBeenCalled();
  await act(async()=>window.dispatchEvent(new Event('focus')));expect(inbox).toHaveBeenCalledTimes(2);
 });
 it('keeps the personal workspace for customers',async()=>{
  auth.mockResolvedValue({user:{id:'customer'},profile:null,isAdmin:false});inbox.mockResolvedValue([]);
  await act(async()=>root.render(<UserDashboard/>));
  expect(host.textContent).toContain('شکل‌های من');expect(host.querySelector('.admin-workspace')).toBeNull();expect(projectsList).toHaveBeenCalledOnce();
 });
});
