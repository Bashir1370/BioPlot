// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
vi.mock('./accountAuth',()=>({accountDisplayName:()=> 'مدیر'}));
import {WorkspaceSidebar} from './WorkspaceSidebar';

describe('Admin workspace navigation',()=>{
 let host:HTMLDivElement,root:Root;
 const account={user:{id:'admin-1',email:'admin@example.com'},profile:null,isAdmin:true};
 const props={account,fa:true,collapsed:false,setCollapsed:vi.fn(),mobile:false,setMobile:vi.fn()};
 beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);host=document.createElement('div');document.body.append(host);root=createRoot(host);});
 afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
 it('shows website content editing only when the admin workspace is active',async()=>{
  await act(async()=>root.render(<WorkspaceSidebar {...props}/>));
  expect(host.querySelector('a[href="/admin/showcase"]')).toBeNull();
  await act(async()=>root.render(<WorkspaceSidebar {...props} adminWorkspace/>));
  const link=host.querySelector<HTMLAnchorElement>('a[href="/admin/showcase"]');
  expect(link?.textContent).toContain('ویرایش محتوای سایت');
 });
});
