// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {OrderDetail} from './OrderDetail';
import type {DesignOrder,OrderFile} from './orderModel';
const order:DesignOrder={id:'example-order-id',user_id:'customer',title:'طراحی مسیر سیگنال‌دهی',kind:'figure',brief:{route:'idea',message:'نمایش مسیر سیگنال‌دهی و ارتباط اجزای اصلی آن',audience:'پژوهشگران',requirements:'',style:'',formats:['PNG','SVG']},requested_date:'2026-12-01',status:'submitted',quote_amount:null,quote_deposit_amount:null,quote_currency:null,quote_scope:null,quote_days:null,quote_revisions:null,revision_round:0,created_at:'2026-11-16T10:00:00Z',updated_at:'2026-11-16T10:00:00Z'};
const reference:OrderFile={id:'ref',order_id:order.id,uploader_id:'customer',kind:'reference',name:'reference.pdf',path:'ref.pdf',size:1024,created_at:order.created_at};
describe('Customer order detail',()=>{
 let host:HTMLDivElement,root:Root;
 const transition=vi.fn(async()=>true),download=vi.fn();
 beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);transition.mockClear();download.mockClear();host=document.createElement('div');document.body.append(host);root=createRoot(host);});
 afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
 async function render(current=order){await act(async()=>root.render(<OrderDetail fa admin={false} userId="customer" order={current} files={[reference]} messages={[]} events={[]} busy={false} onTransition={transition} onDownload={download} onUpload={async()=>true} onMessage={async()=>true}/>));}
 it('shows the entered brief and references together, without empty deliverable sections',async()=>{
  await render();const card=host.querySelector('.order-request-summary')!;
  expect(card.textContent).toContain('سفارش شما با موفقیت ثبت شد');
  expect(card.textContent).toContain(order.title);expect(card.textContent).toContain(order.brief.message);
  expect(card.textContent).toContain(order.brief.audience);expect(card.textContent).toContain('reference.pdf');
  expect(host.textContent).not.toContain('گام بعدی');expect(host.textContent).not.toContain('No files yet.');
  expect(host.querySelectorAll('.order-file-group')).toHaveLength(0);
  const get=card.querySelector<HTMLButtonElement>('[aria-label="دریافت reference.pdf"]')!;
  await act(async()=>get.click());expect(download).toHaveBeenCalledWith(reference);
  const cancel=Array.from(card.querySelectorAll('button')).find(b=>b.textContent==='لغو درخواست')!;
  await act(async()=>cancel.click());expect(transition).not.toHaveBeenCalled();
  expect(card.querySelector<HTMLTextAreaElement>('.order-action-form textarea')?.required).toBe(true);
 });
 it('keeps quote approval explicit and does not show a pending-review message after quoting',async()=>{
  await render({...order,status:'quoted',quote_amount:100,quote_deposit_amount:30,quote_currency:'USD',quote_scope:'Scientific illustration',quote_days:7,quote_revisions:2});
  expect(host.textContent).not.toContain('سفارش شما با موفقیت ثبت شد');
  const accept=Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='تأیید پیشنهاد')!;
  await act(async()=>accept.click());expect(transition).not.toHaveBeenCalled();
  const checkbox=host.querySelector<HTMLInputElement>('.order-action-form input[type="checkbox"]')!;
  expect(checkbox.required).toBe(true);await act(async()=>checkbox.click());
  await act(async()=>host.querySelector('.order-action-form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(transition).toHaveBeenCalledWith('accepted','',undefined);
 });
});
