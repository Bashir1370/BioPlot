// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {OrderDetail} from './OrderDetail';
import type {DesignOrder,OrderFile,OrderMessage,OrderEvent} from './orderModel';
const order:DesignOrder={id:'example-order-id',user_id:'customer',title:'طراحی مسیر سیگنال‌دهی',kind:'figure',brief:{route:'idea',message:'نمایش مسیر سیگنال‌دهی و ارتباط اجزای اصلی آن',audience:'پژوهشگران',requirements:'',style:'',formats:['PNG','SVG']},requested_date:'2026-12-01',status:'submitted',quote_amount:null,quote_deposit_amount:null,quote_currency:null,quote_scope:null,quote_days:null,quote_revisions:null,revision_round:0,created_at:'2026-11-16T10:00:00Z',updated_at:'2026-11-16T10:00:00Z'};
const reference:OrderFile={id:'ref',order_id:order.id,uploader_id:'customer',kind:'reference',name:'reference.pdf',path:'ref.pdf',size:1024,created_at:order.created_at};
describe('Customer order detail',()=>{
 let host:HTMLDivElement,root:Root;
 const transition=vi.fn(async()=>true),download=vi.fn();
 beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);transition.mockClear();download.mockClear();host=document.createElement('div');document.body.append(host);root=createRoot(host);});
 afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
 async function render(current=order,messages:OrderMessage[]=[],events:OrderEvent[]=[],admin=false){await act(async()=>root.render(<OrderDetail fa admin={admin} userId={admin?'admin':'customer'} order={current} files={[reference]} messages={messages} events={events} busy={false} onTransition={transition} onDownload={download} onUpload={async()=>true} onMessage={async()=>true}/>));}
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
  const cards=Array.from(host.querySelector('.order-detail-view')!.children);
  expect(cards.indexOf(host.querySelector('.order-quote')!)).toBeLessThan(cards.indexOf(host.querySelector('.order-request-summary')!));
  expect(host.querySelector('.quote-payment-split')).toBeNull();
  expect(host.querySelector('.order-payment-terms')?.textContent).toContain('پس از پایان طراحی و تأیید رضایت شما');
  const accept=Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='تأیید پیشنهاد')!;
  await act(async()=>accept.click());expect(transition).not.toHaveBeenCalled();
  const checkbox=host.querySelector<HTMLInputElement>('.order-action-form input[type="checkbox"]')!;
  expect(checkbox.required).toBe(true);await act(async()=>checkbox.click());
  await act(async()=>host.querySelector('.order-action-form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(transition).toHaveBeenCalledWith('accepted','',undefined);
 });
 it('shows an administrator status note above the original request and accurately explains a missing quote',async()=>{
  const note='سلام، سفارش شما بررسی شد و مورد تأیید قرار گرفت';
  await render({...order,status:'reviewing'},[],[{id:'review-note',order_id:order.id,actor_id:'admin',status:'reviewing',detail:{note},created_at:order.updated_at}]);
  const updates=host.querySelector('.order-team-updates')!;
  expect(updates.textContent).toContain(note);
  expect(updates.closest('details')).toBeNull();
  expect(updates.textContent).toContain('پیشنهاد قیمت هنوز ارسال نشده است');
  expect(host.querySelector('.order-quote')).toBeNull();
  expect(host.querySelector('.order-request-summary')?.textContent).not.toContain('سفارش شما با موفقیت ثبت شد');
 });
 it('surfaces a team conversation reply without mislabelling a customer message as a team update',async()=>{
  await render(order,[{id:'customer-msg',order_id:order.id,author_id:'customer',body:'توضیح مشتری',created_at:order.created_at},{id:'team-msg',order_id:order.id,author_id:'admin',body:'پاسخ طراحی به مشتری',created_at:order.updated_at}]);
  expect(host.querySelector('.order-team-updates')?.textContent).toContain('پاسخ طراحی به مشتری');
  expect(host.querySelector('.order-team-updates')?.textContent).not.toContain('توضیح مشتری');
 });

 it('submits a proposal without requesting or sending an advance amount',async()=>{
  await render({...order,status:'reviewing',quote_amount:100,quote_scope:'Scientific illustration',quote_currency:'USD'},[],[],true);
  const send=Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='ارسال پیشنهاد')!;
  await act(async()=>send.click());
  const form=host.querySelector<HTMLFormElement>('.order-action-form')!;
  expect(form.textContent).not.toContain('پیش‌پرداخت اولیه');
  expect(form.querySelector('.order-payment-terms')?.textContent).toContain('اطلاعات حساب هنگام تحویل نهایی');
  await act(async()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(transition).toHaveBeenCalledWith('quoted','',{amount:100,currency:'USD',scope:'Scientific illustration',days:7,revisions:2});
 });
 it('keeps the delivery payment details visible after later messages and order completion',async()=>{
  const details='فایل نهایی آماده است. شماره حساب: SAMPLE-ACCOUNT — صاحب حساب: تیم طراحی';
  const events:OrderEvent[]=[{id:'delivery',order_id:order.id,actor_id:'admin',status:'delivered',detail:{note:details},created_at:order.updated_at}];
  const messages:OrderMessage[]=Array.from({length:4},(_,i)=>({id:`later-${i}`,order_id:order.id,author_id:'admin',body:`پیام بعدی ${i}`,created_at:'2026-11-17T10:00:00Z'}));
  await render({...order,status:'completed'},messages,events);
  expect(host.querySelector('.order-delivery-payment')?.textContent).toContain(details);
  expect(host.querySelector('.order-delivery-payment')?.textContent).toContain('پس از پایان طراحی و تأیید رضایت شما');
 });
 it('prompts the administrator to provide account details only when delivering the final files',async()=>{
  await render({...order,status:'approved'},[],[],true);
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='تحویل نهایی')!.click());
  expect(host.querySelector('.order-action-form')?.textContent).toContain('شماره حساب، شبا یا کارت و نام صاحب حساب');
 });

});
