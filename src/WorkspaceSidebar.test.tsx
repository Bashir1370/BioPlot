// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
vi.mock('./accountAuth',()=>({accountDisplayName:()=> 'مدیر'}));
import {WorkspaceSidebar} from './WorkspaceSidebar';
import type {AccountState} from './accountAuth';

describe('Workspace sidebar content editor navigation',()=>{
 let host:HTMLDivElement,root:Root;
 const adminAccount={user:{id:'admin-1',email:'admin@example.com'},profile:null,isAdmin:true} as unknown as AccountState;
 const customerAccount={user:{id:'customer-1',email:'customer@example.com'},profile:null,isAdmin:false} as unknown as AccountState;
 const props={fa:true,collapsed:false,setCollapsed:vi.fn(),mobile:false,setMobile:vi.fn()};
 beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);host=document.createElement('div');document.body.append(host);root=createRoot(host);});
 afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
 it('shows website content editing in the admin dashboard without a special page flag',async()=>{
  await act(async()=>root.render(<WorkspaceSidebar {...props} account={adminAccount}/>));
  const link=host.querySelector<HTMLAnchorElement>('a[href="/admin/showcase"]');
  expect(link?.textContent).toContain('ویرایش محتوای سایت');
 });
 it('does not show the admin content editor to customers',async()=>{
  await act(async()=>root.render(<WorkspaceSidebar {...props} account={customerAccount}/>));
  expect(host.querySelector('a[href="/admin/showcase"]')).toBeNull();
 });
});
