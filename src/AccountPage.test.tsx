// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({save:vi.fn(async()=>({emailChanged:false})),logout:vi.fn(async()=>{})}));
vi.mock('./accountAuth',()=>({getAccountState:async()=>({user:{id:'user',email:'user@example.com',user_metadata:{first_name:'زیبا',last_name:'ملکشاهی',contact_phone:'09123456789'}},profile:{display_name:'زیبا ملکشاهی',preferred_language:'fa'},isAdmin:true}),accountDisplayName:()=> 'زیبا ملکشاهی',subscribeAccountState:()=>()=>{},updateUserProfile:mocks.save,signOutUser:mocks.logout,signInUser:vi.fn(),signUpUser:vi.fn()}));
import {AccountPage} from './AccountPage';
it('shows only contact details and saves them, with a working sign-out action',async()=>{
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);localStorage.setItem('bioplot-lang','fa');history.replaceState(null,'','/account');
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<AccountPage/>));
  expect(Array.from(host.querySelectorAll('main label')).map(e=>e.textContent)).toEqual(['نام','نام خانوادگی','ایمیل','شماره تماس']);
  expect(Array.from(host.querySelectorAll<HTMLInputElement>('main input')).map(e=>e.value)).toEqual(['زیبا','ملکشاهی','user@example.com','09123456789']);
  expect(host.querySelector('.account-admin-card,.account-welcome,.account-meta-row')).toBeNull();
  await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(mocks.save).toHaveBeenCalledWith({displayName:'زیبا ملکشاهی',preferredLanguage:'fa',firstName:'زیبا',lastName:'ملکشاهی',phone:'09123456789',email:'user@example.com'});
  await act(async()=> (host.querySelector('main button[type="button"]') as HTMLButtonElement).click());
  expect(mocks.logout).toHaveBeenCalledOnce();expect(host.querySelector('.account-auth-card')).not.toBeNull();
 }finally{await act(async()=>root.unmount());host.remove();localStorage.clear();vi.unstubAllGlobals();}
});
