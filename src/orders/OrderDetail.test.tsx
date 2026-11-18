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
 const tab=(label:string)=>Array.from(host.querySelectorAll<HTMLButtonElement>('nav button')).find(button=>button.textContent===label)!;
 const chooseTab=(label:string)=>act(async()=>tab(label).click());
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
 it('updates proposal delivery days when the same order is refreshed and permits explicit rejection',async()=>{
  const proposal={...order,status:'quoted' as const,quote_amount:600000,quote_currency:'IRT' as const,quote_scope:'Scientific illustration',quote_days:7,quote_revisions:6};
  await render(proposal);
  expect(host.querySelector('.quote-facts')?.textContent).toContain('۷ روز');
  await render({...proposal,quote_days:2,updated_at:'2026-11-18T10:00:00Z'});
  expect(host.querySelector('.quote-facts')?.textContent).toContain('۲ روز');
  expect(host.querySelector('.quote-facts')?.textContent).not.toContain('۷ روز');
  const reject=Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='رد پیشنهاد و لغو سفارش')!;
  await act(async()=>reject.click());
  const input=host.querySelector<HTMLTextAreaElement>('.order-action-form textarea')!;
  await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(input,'شرایط پیشنهاد مناسب نیست');input.dispatchEvent(new Event('input',{bubbles:true}));});
  await act(async()=>host.querySelector('.order-action-form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(transition).toHaveBeenCalledWith('cancelled','شرایط پیشنهاد مناسب نیست',undefined);
 });
 it('does not prefill seven days for an unquoted order',async()=>{
  await render({...order,status:'reviewing'},[],[],true);
  const button=Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='ارسال پیشنهاد')!;
  await act(async()=>button.click());
  const label=Array.from(host.querySelectorAll('label')).find(l=>l.textContent==='زمان طراحی (روز)')!;
  expect(label.querySelector<HTMLInputElement>('input')!.value).toBe('');
 });
 it('does not offer returning a sent proposal to review',async()=>{
  await render({...order,status:'quoted',quote_amount:100,quote_days:2,quote_scope:'Scientific illustration'},[],[],true);
  expect(Array.from(host.querySelectorAll('button')).some(b=>b.textContent==='شروع بررسی'||b.textContent==='بازگرداندن پیشنهاد به بررسی')).toBe(false);
 });
 it('lets administrators resend a withdrawn proposal directly from Agreement',async()=>{
  const current={...order,status:'reviewing' as const,quote_amount:600000,quote_days:2,quote_scope:'Scientific illustration'};
  const events:OrderEvent[]=[{id:'sent',order_id:order.id,actor_id:'admin',status:'quoted',detail:{},created_at:order.created_at}];
  await act(async()=>root.render(<OrderDetail fa admin canManage userId="admin" order={current} files={[]} events={events} messages={[]} busy={false} onTransition={transition} onDownload={download} onUpload={async()=>true} onMessage={async()=>true} onPublishPreview={async()=>true}/>));
  await chooseTab('توافق');
  const send=Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='ارسال پیشنهاد')!;
  expect(send).toBeDefined();await act(async()=>send.click());
  const form=host.querySelector<HTMLFormElement>('.order-action-form')!;
  await act(async()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(transition).toHaveBeenCalledWith('quoted','',expect.objectContaining({days:2,amount:600000}));
 });
 it('keeps quote approval explicit and does not show a pending-review message after quoting',async()=>{
  await render({...order,status:'quoted',quote_amount:100,quote_deposit_amount:30,quote_currency:'USD',quote_scope:'Scientific illustration',quote_days:7,quote_revisions:2});
  expect(host.textContent).not.toContain('سفارش شما با موفقیت ثبت شد');
  expect(host.querySelector('.admin-order-tab-content>.order-quote')).not.toBeNull();
  expect(host.querySelector('.admin-order-tab-content>.order-request-summary')).toBeNull();
  expect(host.querySelector('.quote-payment-split')).toBeNull();
  expect(host.querySelector('.order-payment-terms')?.textContent).toContain('پس از پایان طراحی و تأیید رضایت شما');
  expect(host.querySelector('.order-quote-decision')?.textContent).toContain('رد پیشنهاد و لغو سفارش');
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
  const updates=host.querySelector('.order-current-conversation')!;
  expect(updates.textContent).toContain(note);
  expect(updates.closest('details')).toBeNull();
  expect(host.querySelector('.order-quote-pending')?.textContent).toContain('پیشنهاد قیمت هنوز ارسال نشده است');
  expect(host.querySelector('.order-quote')).toBeNull();
  expect(host.querySelector('.order-request-summary')?.textContent).not.toContain('سفارش شما با موفقیت ثبت شد');
 });
 it('surfaces a team conversation reply without mislabelling a customer message as a team update',async()=>{
  await render(order,[{id:'customer-msg',order_id:order.id,author_id:'customer',body:'توضیح کاربر سایت',created_at:order.created_at},{id:'team-msg',order_id:order.id,author_id:'admin',body:'پاسخ طراحی به کاربر سایت',created_at:order.updated_at}]);
  const entries=host.querySelectorAll('.order-current-conversation article');
  expect(entries).toHaveLength(2);
  expect(entries[0].querySelector('b')?.textContent).toBe('کاربر سایت');
  expect(entries[1].querySelector('b')?.textContent).toBe('تیم طراحی');
  expect(entries[1].textContent).toContain('پاسخ طراحی به کاربر سایت');
 });

 it('submits a proposal without requesting or sending an advance amount',async()=>{
  await render({...order,status:'reviewing',quote_amount:100,quote_scope:'Scientific illustration',quote_currency:'USD',quote_days:2},[],[],true);
  const send=Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='ارسال پیشنهاد')!;
  await act(async()=>send.click());
  const form=host.querySelector<HTMLFormElement>('.order-action-form')!;
  expect(form.textContent).not.toContain('پیش‌پرداخت اولیه');
  expect(form.querySelector('.order-payment-terms')?.textContent).toBe('در صورت موافقت شما با این پیشنهاد، مبلغ پس از پایان طراحی و تأیید رضایت شما پرداخت می‌شود.');
  await act(async()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(transition).toHaveBeenCalledWith('quoted','',{amount:100,currency:'USD',scope:'Scientific illustration',days:2,revisions:2});
 });
 it('keeps delivery details in the delivery stage and archives them at completion',async()=>{
  const details='فایل نهایی آماده است. شماره حساب: SAMPLE-ACCOUNT — صاحب حساب: تیم طراحی';
  const events:OrderEvent[]=[{id:'delivery',order_id:order.id,actor_id:'admin',status:'delivered',detail:{note:details},created_at:order.updated_at}];
  const messages:OrderMessage[]=Array.from({length:4},(_,i)=>({id:`later-${i}`,order_id:order.id,author_id:'admin',body:`پیام بعدی ${i}`,created_at:'2026-11-17T10:00:00Z'}));
  await render({...order,status:'delivered'},messages,events);
  expect(host.querySelector('.order-delivery-payment')?.textContent).toContain(details);
  await render({...order,status:'completed'},messages,events);
  expect(host.querySelector('.order-delivery-payment')).toBeNull();
  await chooseTab('تحویل');
  expect(host.querySelector('.order-delivery-payment')?.textContent).toContain(details);
  expect(host.querySelector('.order-inline-actions')).toBeNull();
 });
 it('prompts the administrator to provide account details only when delivering the final files',async()=>{
  await render({...order,status:'approved'},[],[],true);
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='ثبت پرداخت و تحویل نهایی')!.click());
  expect(host.querySelector('.order-action-form')?.textContent).toContain('شماره حساب، شبا یا کارت و نام صاحب حساب');
 });

 it('keeps old replies and conversations under their original stages instead of carrying them into design',async()=>{
  const stamp=(hour:number)=>`2026-11-16T${String(hour).padStart(2,'0')}:00:00Z`;
  const events:OrderEvent[]=[
   {id:'request-note',order_id:order.id,actor_id:'admin',status:'reviewing',detail:{note:'پاسخ مرحله درخواست'},created_at:stamp(10)},
   {id:'quote-note',order_id:order.id,actor_id:'admin',status:'quoted',detail:{note:'پاسخ مرحله توافق'},created_at:stamp(11)},
   {id:'design-start',order_id:order.id,actor_id:'admin',status:'designing',detail:{},created_at:stamp(12)},
  ];
  const messages:OrderMessage[]=[
   {id:'old-message',order_id:order.id,author_id:'admin',body:'پیام قدیمی توافق',created_at:stamp(11)},
   {id:'current-message',order_id:order.id,author_id:'admin',body:'پیام مخصوص طراحی',created_at:stamp(13)},
  ];
  await render({...order,status:'designing',updated_at:stamp(12),quote_amount:100,quote_currency:'USD',quote_scope:'Agreed illustration'},messages,events);
  const conversation=()=>host.querySelector('.order-current-conversation')?.textContent;
  expect(Array.from(host.querySelectorAll('nav button'),button=>button.textContent)).toEqual(
   ['ثبت درخواست','توافق','طراحی','تحویل','بازبینی','پرداخت مالی','تکمیل'],
  );
  expect(tab('طراحی').getAttribute('aria-current')).toBe('step');
  expect(tab('تحویل').disabled).toBe(true);
  expect(conversation()).toContain('پیام مخصوص طراحی');
  expect(conversation()).not.toContain('پیام قدیمی توافق');

  await chooseTab('توافق');
  expect(tab('توافق').getAttribute('aria-pressed')).toBe('true');
  expect(host.querySelector('.order-quote')?.textContent).toContain('Agreed illustration');
  expect(conversation()).toContain('پاسخ مرحله توافق');
  expect(conversation()).toContain('پیام قدیمی توافق');
  expect(conversation()).not.toContain('پیام مخصوص طراحی');
  expect(host.querySelector('.order-current-conversation form')).toBeNull();
  expect(host.querySelector('.order-inline-actions')).toBeNull();

  await chooseTab('ثبت درخواست');
  expect(host.querySelector('.order-request-summary')?.textContent).toContain(order.brief.message);
  expect(conversation()).toContain('پاسخ مرحله درخواست');
  await chooseTab('طراحی');
  expect(host.querySelector('.order-design-progress')).not.toBeNull();
 });
 it('keeps preview approval available outside the archived agreement',async()=>{
  await render({...order,status:'review',quote_amount:100,quote_currency:'USD',quote_scope:'Agreed illustration'});
  expect(host.querySelector('.order-review-stage')?.textContent).toContain('تأیید طرح و رفتن به پرداخت');
  expect(host.querySelector('.admin-order-tab-content>.order-quote')).toBeNull();
 });

 it('offers both review decisions next to the released design and separates the resulting stages',async()=>{
  const preview:OrderFile={...reference,id:'preview',kind:'preview',name:'design.pdf'};
  const event=(status:OrderEvent['status'],note=''):OrderEvent=>({id:status,status,actor_id:status==='revision_requested'?'customer':'admin',order_id:order.id,created_at:order.created_at,detail:{note}});
  const props={fa:true,admin:false,userId:'customer',files:[preview],messages:[],busy:false,onTransition:transition,onDownload:download,onUpload:async()=>true,onMessage:async()=>true};
  const quoted={...order,quote_amount:100,quote_currency:'USD' as const};
  const draw=async(status:DesignOrder['status'],events:OrderEvent[])=>act(async()=>root.render(<OrderDetail {...props} order={{...quoted,status}} events={events}/>));
  await draw('designing',[event('designing')]);
  expect(host.querySelector('[aria-label="دریافت design.pdf"]')).toBeNull();
  await draw('review',[event('designing'),event('review','پیام همراه طرح')]);
  const card=host.querySelector('.order-review-stage')!;
  expect(card.textContent).toContain('design.pdf');
  expect(card.textContent).toContain('پیام همراه طرح');
  expect(host.querySelector('.order-current-conversation')?.textContent).not.toContain('پیام همراه طرح');
  expect(tab('تحویل').getAttribute('aria-current')).toBe('step');
  expect(tab('بازبینی').disabled).toBe(true);
  const choose=(label:string)=>Array.from(card.querySelectorAll('button')).find(button=>button.textContent===label)!.click();
  await act(async()=>choose('تأیید طرح و رفتن به پرداخت'));
  await act(async()=>card.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(transition).toHaveBeenLastCalledWith('approved','',undefined);
  await act(async()=>choose('نیاز به بازبینی'));
  expect(card.querySelector('textarea')?.required).toBe(true);
  await draw('revision_requested',[event('review'),event('revision_requested','برچسب سمت راست بزرگ‌تر شود')]);
  expect(tab('بازبینی').getAttribute('aria-current')).toBe('step');
  expect(host.querySelector('.order-current-conversation')?.textContent).toContain('برچسب سمت راست بزرگ‌تر شود');
  await chooseTab('تحویل');
  expect(host.querySelector('.order-review-stage')?.textContent).toContain('design.pdf');
  expect(host.querySelector('.order-inline-actions')).toBeNull();
  await draw('approved',[event('review'),event('approved')]);
  expect(host.querySelector('.order-settlement-stage')?.textContent).toContain('۱۰۰');
  expect(tab('پرداخت مالی').getAttribute('aria-current')).toBe('step');
  expect(tab('پرداخت مالی').getAttribute('aria-pressed')).toBe('true');
  expect(tab('بازبینی').disabled).toBe(true);
 });

});
