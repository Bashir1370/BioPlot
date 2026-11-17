import {AdminOrderTabs,AdminPreviewForm,adminOrderStages} from './AdminOrderTabs';
import {useStudioCopy} from './StudioContent';
import {OrderFilePicker} from './OrderFilePicker';
import {OrderRequestSummary} from './OrderRequestSummary';
import {OrderReviewStage} from './OrderReviewStage';
import {OrderDesignProgress} from './OrderDesignProgress';
import {useEffect,useState,type ReactNode,type FormEvent} from 'react';
import {groupOrderMessages,orderMessageStage} from './orderMessagePhases';
import {DownloadSimple,ChatCircle,Clock,CheckCircle} from '@phosphor-icons/react';
import {allowedTransitions,serviceLabels,statusLabels,type DesignOrder,type OrderFile,type OrderMessage,type OrderEvent,type OrderStatus,type Quote} from './orderModel';
const actionLabels:Partial<Record<OrderStatus,[string,string]>>={reviewing:['شروع بررسی','Start review'],quoted:['ارسال پیشنهاد','Send quote'],accepted:['تأیید پیشنهاد','Accept quote'],designing:['شروع طراحی','Start design'],review:['ارسال طرح برای بررسی مشتری','Send design for customer review'],approved:['تأیید طرح و رفتن به تسویه','Approve design and continue to settlement'],revision_requested:['نیاز به بازبینی','Request changes'],delivered:['ثبت تسویه و تحویل نهایی','Record settlement and deliver files'],completed:['تأیید تکمیل سفارش','Confirm completion'],cancelled:['لغو درخواست','Cancel request']};
const fileLabels:Record<OrderFile['kind'],[string,string]>={reference:['نمونه و منابع','References'],preview:['پیش‌نمایش','Previews'],final:['فایل نهایی','Final files']};
export function OrderDetail({fa,admin,canManage=admin,userId,order,files,messages,events,busy,onTransition,onMessage,onUpload,onDownload,onPublishPreview,tools}:{fa:boolean;admin:boolean;canManage?:boolean;userId:string;order:DesignOrder;files:OrderFile[];messages:OrderMessage[];events:OrderEvent[];busy:boolean;onTransition:(status:OrderStatus,note:string,quote?:Quote)=>Promise<boolean>;onMessage:(body:string)=>Promise<boolean>;onUpload:(files:File[],kind:OrderFile['kind'])=>Promise<boolean>;onDownload:(file:OrderFile)=>void;onPublishPreview?:(files:File[],note:string)=>Promise<boolean>;tools?:ReactNode}){
 const t=useStudioCopy(fa);const [action,setAction]=useState<OrderStatus|null>(null),[note,setNote]=useState(''),[message,setMessage]=useState(''),[agree,setAgree]=useState(false),[fileKind,setFileKind]=useState<OrderFile['kind']>('reference');
 const [quote,setQuote]=useState<Quote>({amount:order.quote_amount??0,currency:order.quote_currency??'IRT',scope:order.quote_scope??'',days:order.quote_days??7,revisions:order.quote_revisions??2});
 const paymentTerms=t('در صورت موافقت شما با این پیشنهاد، مبلغ پس از پایان طراحی و تأیید رضایت شما پرداخت می‌شود.','If you accept this proposal, payment is due after the design is completed and you confirm your satisfaction.');
 const terminal=['completed','cancelled'].includes(order.status);
 const manageTabs=canManage&&!!onPublishPreview;
 const actions=allowedTransitions(order.status,canManage).filter(status=>!manageTabs||status!=='designing');
 const actionLabel=(status:OrderStatus)=>status==='reviewing'&&order.status==='submitted'?t('تأیید درخواست','Confirm request'):t(actionLabels[status]?.[0]??'',actionLabels[status]?.[1]??'');
 const date=(value:string)=>new Date(value).toLocaleString(fa?'fa-IR':'en-US',{dateStyle:'medium',timeStyle:'short'});
 const currency=(value:string|null)=>value==='IRT'?t('تومان','toman'):value==='USD'?t('دلار آمریکا','USD'):t('یورو','EUR');
 const amount=(value:number)=>value.toLocaleString(fa?'fa-IR':'en-US');
 const submitAction=async(e:FormEvent)=>{e.preventDefault();if(action&&await onTransition(action,note,action==='quoted'?quote:undefined)){setAction(null);setNote('');setAgree(false);}};
 const submitMessage=async(e:FormEvent)=>{e.preventDefault();if(await onMessage(message))setMessage('');};
 const stages:OrderStatus[]=['submitted','quoted','designing','review','approved','delivered','completed'];
 const actionPanel=actions.length>0&&<div className="order-inline-actions"><div className="order-actions">{actions.map(status=><button disabled={busy} className={status==='cancelled'?'order-danger':(status==='approved'||status==='accepted'||status==='reviewing'&&order.status==='submitted')?'order-primary':''} key={status} onClick={()=>{if(status!==action)setNote('');setAction(status);setAgree(false);}}>{actionLabel(status)}</button>)}</div>{action&&actions.includes(action)&&<form className="order-action-form" onSubmit={submitAction}><h3>{actionLabel(action)}</h3>{action==='revision_requested'&&order.revision_round>=(order.quote_revisions??0)&&<p className="order-hint">{t('تعداد اصلاحات توافق‌شده استفاده شده است. تیم این درخواست را بررسی می‌کند و در صورت نیاز، پیش از شروع پیشنهاد تازه‌ای می‌فرستد.','The agreed revision rounds have been used. The team will review this request and, if needed, send a new quote before proceeding.')}</p>}{action==='quoted'&&<><p className="order-payment-terms">{paymentTerms}</p><div className="order-field-grid"><label>{t('مبلغ کل','Total price')}<input required type="number" min="0.02" max="9999999999" step="0.01" value={quote.amount||''} onChange={e=>setQuote({...quote,amount:Number(e.target.value)})}/></label><label>{t('واحد پول','Currency')}<select value={quote.currency} onChange={e=>setQuote({...quote,currency:e.target.value as Quote['currency']})}><option value="IRT">{t('تومان','Toman')}</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label><label>{t('زمان طراحی (روز)','Design time (days)')}<input required type="number" min="1" max="365" value={quote.days} onChange={e=>setQuote({...quote,days:Number(e.target.value)})}/></label><label>{t('تعداد نوبت اصلاح','Included revisions')}<input required type="number" min="0" max="20" value={quote.revisions} onChange={e=>setQuote({...quote,revisions:Number(e.target.value)})}/></label></div><label>{t('محدوده کار و فایل‌های تحویلی','Scope and deliverables')}<textarea required minLength={10} maxLength={6000} rows={5} value={quote.scope} onChange={e=>setQuote({...quote,scope:e.target.value})}/></label></>}
 {action==='accepted'?<label className="order-check"><input type="checkbox" required checked={agree} onChange={e=>setAgree(e.target.checked)}/>{t('مبلغ، محدوده کار، زمان و پرداخت پس از پایان طراحی و تأیید رضایت خود را می‌پذیرم.','I accept the price, scope, timing and payment after completion and confirmation of my satisfaction.')}</label>:<label>{action==='delivered'?t('پیام تحویل و اطلاعات پرداخت (شماره حساب، شبا یا کارت و نام صاحب حساب)','Delivery message and payment details (account number / IBAN / card and account holder)'):action==='revision_requested'?t('اصلاحات موردنیاز؛ لطفاً نام فایل و بخش مربوط را ذکر کنید','Requested revisions; include the file name and section'):t('توضیح','Note')}<textarea rows={3} placeholder={action==='delivered'?t('اطلاعات حساب را همراه با توضیح تحویل بنویسید؛ این متن برای مشتری نمایش داده می‌شود.','Enter payment account details and a delivery note; this text will be visible to the customer.'):undefined} required={['revision_requested','cancelled'].includes(action)} minLength={['revision_requested','cancelled'].includes(action)?3:undefined} maxLength={6000} value={note} onChange={e=>setNote(e.target.value)}/></label>}
 <button className="order-primary" disabled={busy}>{t('تأیید و ثبت','Confirm')}</button><button type="button" disabled={busy} onClick={()=>setAction(null)}>{t('انصراف','Back')}</button></form>}</div>;
 const phases=groupOrderMessages(order,events,messages);
 const currentMessages=phases.current.messages;
 const pastPhases=phases.previous.filter(phase=>phase.messages.length>0||phase.events.some(event=>typeof event.detail.note==='string'&&event.detail.note.trim()));
 const phaseLabels:[string,string][]=[['ثبت درخواست','Request'],['توافق','Agreement'],['طراحی','Design'],['بازبینی','Review'],['تسویه','Settlement'],['تحویل','Delivery'],['تکمیل','Completion'],['لغو درخواست','Cancellation']];
 useEffect(()=>{setMessage('');setAction(null);setNote('');setAgree(false);},[order.id,phases.current.id,phases.current.stage]);
 const deliveryNote=order.status==='delivered'?events.slice().reverse().find(event=>event.status==='delivered'&&event.actor_id!==order.user_id&&typeof event.detail.note==='string'&&event.detail.note.trim()):undefined;
 const teamUpdates=[
  ...phases.current.events.filter(event=>event.actor_id!==order.user_id&&typeof event.detail.note==='string'&&event.detail.note.trim()).map(event=>({id:`event-${event.id}`,body:String(event.detail.note),created_at:event.created_at,label:t(...statusLabels[event.status])})),
  ...currentMessages.filter(item=>item.author_id!==order.user_id).map(item=>({id:`message-${item.id}`,body:item.body,created_at:item.created_at,label:t('پیام تیم طراحی','Design team message')})),
 ].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).slice(0,3);
 const quotePanel=order.quote_amount!==null&&<section className="order-card order-quote"><div className="order-section-heading"><span>{t('پیشنهاد تیم','Team proposal')}</span><h2>{amount(order.quote_amount)} <small>{currency(order.quote_currency)}</small></h2></div><div className="quote-facts"><span><Clock/>{order.quote_days} {t('روز پس از تأیید پیشنهاد','days after approval')}</span><span>{order.quote_revisions} {t('نوبت اصلاح در محدوده توافق','revision rounds within scope')}</span></div><p className="order-prewrap">{order.quote_scope}</p><p className="order-payment-terms">{paymentTerms}</p>{!admin&&order.status==='quoted'&&actionPanel}</section>;
 const displayedQuote=order.status==='quoted'&&quotePanel;
 const uploadReference=!terminal&&<OrderFilePicker fa={fa} label={t('افزودن فایل مرجع','Add reference files')} disabled={busy} onChange={e=>{const input=e.currentTarget;const selected=Array.from(input.files||[]);if(selected.length)void onUpload(selected,'reference').then(ok=>{if(ok)input.value='';});}}/>;
 const latestDesign=events.filter(event=>event.status==='designing').reduce((latest,event)=>Math.max(latest,Date.parse(event.created_at)),Date.parse(order.created_at));
 const latestReview=events.filter(event=>event.status==='review').reduce((latest,event)=>Math.max(latest,Date.parse(event.created_at)),0);
 const previewFiles=files.filter(file=>file.kind==='preview'&&Date.parse(file.created_at)>=latestDesign);
 const reviewFiles=previewFiles.filter(file=>!latestReview||Date.parse(file.created_at)<=latestReview);
 const designStage=order.status==='accepted'||order.status==='designing';
 const publishingPreview=canManage&&designStage;
 const requestStage=order.status==='submitted'||order.status==='reviewing';
 const reviewDecision=!canManage&&order.status==='review';
 const settlement=order.status==='approved';
 const visibleFileKinds=(['final','preview','reference'] as const).filter(kind=>{
  if(canManage&&settlement&&kind==='final')return true;
  if(admin&&requestStage&&kind==='reference')return true;
  if(kind==='reference'||kind==='preview'&&reviewDecision)return false;
  return files.some(file=>file.kind===kind&&(kind==='preview'?order.status==='revision_requested'&&latestReview>0&&Date.parse(file.created_at)<=latestReview:['delivered','completed'].includes(order.status)));
 });
 const visibleFiles=(kind:OrderFile['kind'])=>files.filter(file=>file.kind===kind&&(admin||kind!=='preview'||Date.parse(file.created_at)<=latestReview));
 const settlementCard=settlement&&<section className="order-card order-settlement-stage">
  <h2>{t('تسویه سفارش','Order settlement')}</h2>
  {order.quote_amount!==null&&<p>{t('مبلغ توافق‌شده','Agreed amount')} <strong>{amount(order.quote_amount)} {currency(order.quote_currency)}</strong></p>}
  <p>{canManage?t('اطلاعات پرداخت را در گفت‌وگوی این مرحله بفرستید. پس از تأیید دریافت وجه، تسویه و تحویل فایل نهایی را ثبت کنید.','Share payment details in this stage’s conversation. After confirming payment, record settlement and deliver the final files.'):t('طرح را تأیید کردید. اطلاعات پرداخت را تیم طراحی در گفت‌وگوی همین مرحله اعلام می‌کند.','You approved the design. The team will share payment details in this stage’s conversation.')}</p>
  {!admin&&canManage&&!manageTabs&&actionPanel}
 </section>;
 const revisionEvent=order.status==='revision_requested'?
  phases.current.events.slice().reverse().find(event=>event.status==='revision_requested'):undefined;
 const revisionCard=order.status==='revision_requested'&&<section className="order-card order-review-stage">
  <h2>{t('طرح نیاز به بازبینی دارد','Design changes requested')}</h2>
  {typeof revisionEvent?.detail.note==='string'&&<p className="order-prewrap" dir="auto">{revisionEvent.detail.note}</p>}
  <p>{t('نسخهٔ اصلاح‌شده پس از آماده‌شدن برای بررسی دوباره در همین سفارش ارسال می‌شود.','The revised design will be sent for another review in this order.')}</p>
  {!admin&&canManage&&actionPanel}
 </section>;
 const previewUpload=publishingPreview&&<section className="order-card order-review-stage">
  <h2>{t('ارسال طرح آماده برای مشتری','Send the completed design to the customer')}</h2>
  <OrderFilePicker fa={fa} label={t('بارگذاری نسخهٔ قابل بررسی','Upload a review copy')} disabled={busy} onChange={event=>{
   const input=event.currentTarget;
   const selected=Array.from(input.files??[]);
   if(selected.length)void onUpload(selected,'preview').then(ok=>{if(ok)input.value='';});
  }}/>
  {order.status==='designing'&&previewFiles.length>0?<>{previewFiles.map(file=><p key={file.id}><bdi>{file.name}</bdi></p>)}{actionPanel}</>:<p>{t('ابتدا فایل طرح را بارگذاری کنید.','Upload a design file first.')}</p>}
 </section>;
 const adminPhases=groupOrderMessages(order,events,messages,adminOrderStages,true);
 if(manageTabs&&onPublishPreview){
  const current=adminPhases.current;
  const allPhases=[...adminPhases.previous,current];
  const sent=events.slice().reverse().find(event=>event.status==='review');
  const previousDesign=events.slice().reverse().find(event=>event.status==='designing'&&sent&&Date.parse(event.created_at)<=Date.parse(sent.created_at));
  const sentFiles=sent?files.filter(file=>file.kind==='preview'&&Date.parse(file.created_at)<=Date.parse(sent.created_at)&&Date.parse(file.created_at)>=Date.parse(previousDesign?.created_at??order.created_at)):[];
  const fileList=(list:OrderFile[])=>list.map(file=><div className="order-file" key={file.id}>
   <bdi>{file.name}</bdi><button type="button" disabled={busy} onClick={()=>onDownload(file)}>{t('دریافت','Download')}</button>
  </div>);
  const eventNotes=(stage:number)=>allPhases.filter(phase=>phase.stage===stage).flatMap(phase=>phase.events)
   .filter(event=>event!==sent&&typeof event.detail.note==='string'&&event.detail.note.trim());
  return <div className="order-detail-view order-admin-workflow">
   <header className="order-detail-heading"><h1 dir="auto">{order.title}</h1></header>
   <AdminOrderTabs fa={fa} stage={current.stage} phaseId={current.id} visited={allPhases.map(phase=>phase.stage)} busy={busy}>
    {tab=>{
     const active=tab===current.stage;
     const notes=tab===4?eventNotes(tab).slice(-1):eventNotes(tab);
     const tabMessages=allPhases.filter(phase=>phase.stage===tab).flatMap(phase=>phase.messages);
     return <>
      {tab===0&&<OrderRequestSummary fa={fa} order={order} briefOnly files={files} busy={busy} onDownload={onDownload}>{active&&actionPanel}</OrderRequestSummary>}
      {tab===1&&<>{quotePanel}{active&&actionPanel}</>}
      {tab===2&&active&&<AdminPreviewForm fa={fa} busy={busy} staged={order.status==='designing'?previewFiles:[]} onPublish={onPublishPreview}/>}
      {tab===3&&<section className="order-card order-review-stage">
       <h2>{t('تحویل طرح','Design delivery')}</h2>
       {order.status==='review'&&<p role="status">{t('در انتظار پاسخ مشتری','Waiting for the customer’s response')}</p>}
       {fileList(sentFiles)}
       {typeof sent?.detail.note==='string'&&sent.detail.note.trim()&&<><h3>{t('پیام ارسالی به مشتری','Message sent to the customer')}</h3><p className="order-prewrap" dir="auto">{sent.detail.note}</p></>}
       {['delivered','completed'].includes(order.status)&&fileList(files.filter(file=>file.kind==='final'))}
       {active&&actionPanel}
      </section>}
      {tab===4&&active&&<><AdminPreviewForm fa={fa} busy={busy} staged={order.status==='designing'?previewFiles:[]} onPublish={onPublishPreview}/>{actionPanel}</>}
      {tab===5&&<>{settlementCard||<section className="order-card order-settlement-stage"><h2>{t('پرداخت مالی','Payment')}</h2>{order.quote_amount!==null&&<p>{amount(order.quote_amount)} {currency(order.quote_currency)}</p>}</section>}
       {active&&<section className="order-card">
        {fileList(files.filter(file=>file.kind==='final'))}
        <OrderFilePicker fa={fa} label={t('بارگذاری فایل نهایی','Upload final files')} disabled={busy} onChange={event=>{
         const input=event.currentTarget;const picked=Array.from(input.files??[]);
         if(picked.length)void onUpload(picked,'final').then(ok=>{if(ok)input.value='';});
        }}/>
        {actionPanel}
       </section>}
      </>}
      {tab===6&&<p role="status">{t('سفارش تکمیل شد','Order completed')}</p>}
      {tab===7&&<p role="status">{t('سفارش لغو شد','Order cancelled')}</p>}
      {(notes.length>0||tabMessages.length>0||active&&tab===5)&&<section className="order-card order-admin-stage-messages">
       <h3>{tab===4?t('درخواست بازبینی مشتری','Customer revision request'):t('پیام‌های این مرحله','Stage messages')}</h3>
       {notes.map(event=><p className="order-prewrap" dir="auto" key={event.id}>{String(event.detail.note)}</p>)}
       {tabMessages.map(item=><p className="order-prewrap" dir="auto" key={item.id}><b>{item.author_id===order.user_id?t('مشتری','Customer'):t('تیم طراحی','Design team')}</b> · {item.body}</p>)}
       {active&&tab===5&&<form onSubmit={submitMessage}><label>{t('اطلاعات پرداخت برای مشتری','Payment information for the customer')}<textarea required maxLength={6000} value={message} onChange={event=>setMessage(event.currentTarget.value)}/></label><button disabled={busy||!message.trim()}>{t('ارسال پیام','Send message')}</button></form>}
      </section>}
     </>;
    }}
   </AdminOrderTabs>
   {!admin&&tools}
  </div>;
 }
 return <div className={admin?'order-detail-view':'order-detail-view order-detail-clean'}>{admin&&<header className="order-detail-heading"><div><span className="order-eyebrow">{t(serviceLabels[order.kind][0],serviceLabels[order.kind][1])} · <bdi>#{order.id.slice(0,8)}</bdi></span><h1 dir="auto">{order.title}</h1><small>{t('ثبت‌شده در ','Submitted ')}{date(order.created_at)}</small></div><span className={`order-status status-${order.status}`}>{t(statusLabels[order.status][0],statusLabels[order.status][1])}</span></header>}
 {!terminal&&<ol className="order-progress">{stages.map((status,i)=><li key={status} className={i<=orderMessageStage[order.status]?'reached':''} aria-current={i===orderMessageStage[order.status]?'step':undefined}><span>{i<orderMessageStage[order.status]?<CheckCircle/>:(i+1).toLocaleString(fa?'fa-IR':'en-US')}</span>{t(...phaseLabels[i])}</li>)}</ol>}
 {!admin&&<>
  <OrderDesignProgress fa={fa} order={order} events={events}/>
  {previewUpload}
  {reviewDecision&&<OrderReviewStage fa={fa} files={reviewFiles} busy={busy} onDownload={onDownload}>{actionPanel}</OrderReviewStage>}
  {settlementCard}
  {revisionCard}
  {(teamUpdates.length>0||order.status==='reviewing'&&order.quote_amount===null)&&<section className="order-card order-team-updates" aria-labelledby="order-team-updates-title"><h2 id="order-team-updates-title">{t('آخرین پاسخ‌های تیم طراحی','Latest design team updates')}</h2>{teamUpdates.map(item=><article key={item.id}><header><b>{item.label}</b><small>{date(item.created_at)}</small></header><p className="order-prewrap" dir="auto">{item.body}</p></article>)}{order.status==='reviewing'&&order.quote_amount===null&&<p className="order-quote-pending">{t('پیشنهاد قیمت هنوز ارسال نشده است. پس از ثبت توسط تیم، مبلغ و شرایط همین‌جا نمایش داده می‌شود.','No price proposal has been sent yet. The price and terms will appear here once the team submits them.')}</p>}</section>}
  {displayedQuote}
  {!requestStage&&order.status!=='quoted'&&!publishingPreview&&!reviewDecision&&!settlement&&!revisionCard&&actions.length>0&&<section className="order-card order-current-phase-actions"><h2>{t('گزینه‌های این مرحله','Actions for this stage')}</h2>{actionPanel}</section>}
  {deliveryNote&&<section className="order-card order-delivery-payment" aria-labelledby="order-delivery-payment-title"><h2 id="order-delivery-payment-title">{t('تحویل نهایی و اطلاعات پرداخت','Final delivery and payment details')}</h2><p className="order-prewrap" dir="auto">{String(deliveryNote.detail.note)}</p><small>{t('پرداخت مبلغ توافق‌شده پس از پایان طراحی و تأیید رضایت شما انجام می‌شود.','Pay the agreed amount after the design is completed and you confirm your satisfaction.')}</small></section>}
 </>}
 {!admin&&requestStage&&<OrderRequestSummary fa={fa} order={order} files={files} busy={busy} onDownload={onDownload}>{tools}{uploadReference}{actionPanel}</OrderRequestSummary>}
 {!admin&&!requestStage&&tools&&<div className="order-detail-navigation">{tools}</div>}
 <div className="order-detail-layout"><div className="order-detail-main">
 {admin&&displayedQuote}
 {admin&&previewUpload}
 {admin&&settlementCard}
 {admin&&revisionCard}
 {admin&&actions.length>0&&!publishingPreview&&<section className="order-card"><h2>{t('عملیات سفارش','Order actions')}</h2>{actionPanel}</section>}
 {(admin||visibleFileKinds.length>0)&&<section className="order-card"><div className="order-section-heading"><span><DownloadSimple/>{t('فایل‌های مشترک و نسخه‌های تحویلی','Shared files & deliverables')}</span><h2>{t('همهٔ نسخه‌ها، در یک پرونده','Every version in one place')}</h2></div>{visibleFileKinds.map(kind=><div className="order-file-group" key={kind}><h3>{t(fileLabels[kind][0],fileLabels[kind][1])}</h3>{visibleFiles(kind).length?visibleFiles(kind).map(file=><div className="order-file" key={file.id}><div><b dir="auto">{file.name}</b><small>{date(file.created_at)} · <bdi>{(file.size/1024/1024).toFixed(2)} MB</bdi></small></div><button disabled={busy} onClick={()=>onDownload(file)} aria-label={`${t('دریافت','Download')} ${file.name}`}><DownloadSimple/>{t('دریافت','Download')}</button></div>):<p className="order-muted">{t('هنوز فایلی اضافه نشده است.','No files yet.')}</p>}</div>)}
 {(admin&&requestStage||canManage&&settlement)&&!terminal&&<div className="order-upload">{admin&&requestStage&&<label>{t('نوع فایل اشتراکی','Shared file type')}<select value={fileKind} onChange={e=>setFileKind(e.target.value as OrderFile['kind'])}>{Object.entries(fileLabels).map(([id,labels])=><option key={id} value={id}>{t(labels[0],labels[1])}</option>)}</select></label>}<OrderFilePicker fa={fa} label={settlement?t('بارگذاری فایل نهایی','Upload final files'):t('افزودن فایل','Add files')} disabled={busy} onChange={e=>{const input=e.currentTarget;const selected=Array.from(input.files||[]);if(selected.length)void onUpload(selected,settlement?'final':fileKind).then(ok=>{if(ok)input.value='';});}}/><small>{t('هر فایل تا ۲۰ مگابایت. فایل‌های بارگذاری‌شده برای هر دو طرف قابل دریافت‌اند و نسخه‌های قبلی حفظ می‌شوند.','Up to 20 MB per file. Uploads are shared with both parties; earlier versions are retained.')}</small></div>}</section>}
 <section className="order-card order-current-conversation"><h2><ChatCircle/> {t('گفت‌وگوی این مرحله','Conversation for this stage')} · {t(...phaseLabels[phases.current.stage])}</h2><div className="order-messages">{currentMessages.length===0?<p className="order-muted">{t('پرسش‌ها و توضیحات تکمیلی را همین‌جا بنویسید.','Keep questions and clarifications here.')}</p>:currentMessages.map(item=><article className={item.author_id===userId?'own':''} key={item.id}><header><b>{item.author_id===order.user_id?t('مشتری','Customer'):t('تیم طراحی','Design team')}</b><small>{date(item.created_at)}</small></header><p className="order-prewrap" dir="auto">{item.body}</p></article>)}</div>{!terminal&&<form onSubmit={submitMessage}><label>{t('پیام جدید','New message')}<textarea required rows={3} maxLength={6000} value={message} onChange={e=>setMessage(e.target.value)}/></label><button className="order-primary" disabled={busy||!message.trim()}>{t('ارسال پیام','Send message')}</button></form>}</section>
 {pastPhases.length>0&&<details className="order-stage-message-history"><summary>{t('پیام‌های مراحل قبل','Messages from previous stages')}</summary>{pastPhases.map(phase=><details className="order-stage-message-group" key={phase.id}><summary>{t(...phaseLabels[phase.stage])} · {date(phase.startedAt)}</summary><div className="order-messages">{phase.events.filter(event=>typeof event.detail.note==='string'&&event.detail.note.trim()).map(event=><article className={event.actor_id===userId?'own':''} key={`note-${event.id}`}><header><b>{t(...statusLabels[event.status])} · {event.actor_id===order.user_id?t('مشتری','Customer'):t('تیم طراحی','Design team')}</b><small>{date(event.created_at)}</small></header><p className="order-prewrap" dir="auto">{String(event.detail.note)}</p></article>)}{phase.messages.map(item=><article className={item.author_id===userId?'own':''} key={item.id}><header><b>{item.author_id===order.user_id?t('مشتری','Customer'):t('تیم طراحی','Design team')}</b><small>{date(item.created_at)}</small></header><p className="order-prewrap" dir="auto">{item.body}</p></article>)}</div></details>)}</details>}
 </div><aside className="order-detail-side">{admin?<><details className="order-history-collapsed" open={requestStage||undefined}><summary>{t('شرح سفارش','Order brief')}</summary><section className="order-card"><dl><dt>{t('روش شروع','Starting point')}</dt><dd>{order.brief.route==='idea'?t('طراحی از ایده','From an idea'):order.brief.route==='reference'?t('بر اساس نمونه','From references'):t('تکمیل طرح','Refine a draft')}</dd><dt>{t('پیام علمی','Scientific message')}</dt><dd className="order-prewrap" dir="auto">{order.brief.message}</dd>{[[t('مخاطب','Audience'),order.brief.audience],[t('الزامات','Requirements'),order.brief.requirements],[t('سبک','Style'),order.brief.style],[t('موعد درخواستی (تأییدنشده)','Requested date (unconfirmed)'),order.requested_date],[t('خروجی‌های درخواستی','Requested formats'),order.brief.formats.join(' · ')]].map(([label,value])=>value?<div key={label}><dt>{label}</dt><dd dir="auto">{value}</dd></div>:null)}</dl></section></details><section className="order-card"><h2>{t('تاریخچه سفارش','Order history')}</h2><ol className="order-timeline">{events.slice().reverse().map(event=><li key={event.id}><b>{t(statusLabels[event.status][0],statusLabels[event.status][1])}</b><small>{date(event.created_at)}</small>{typeof event.detail.note==='string'&&event.detail.note&&<p dir="auto">{event.detail.note}</p>}{typeof event.detail.scope==='string'&&<details><summary>{t('متن توافق در این مرحله','Agreement at this step')}</summary><p className="order-prewrap" dir="auto">{event.detail.scope}</p><small>{amount(Number(event.detail.amount))} {currency(String(event.detail.currency))} · {String(event.detail.days)} {t('روز','days')} · {String(event.detail.revisions)} {t('اصلاح','revisions')}</small></details>}</li>)}</ol></section></>:<details className="order-history-collapsed"><summary>{t('تاریخچه سفارش','Order history')}</summary>{!requestStage&&<OrderRequestSummary fa={fa} order={order} files={files} busy={busy} onDownload={onDownload}/>}<section className="order-card"><h2>{t('تاریخچه سفارش','Order history')}</h2><ol className="order-timeline">{events.slice().reverse().map(event=><li key={event.id}><b>{t(statusLabels[event.status][0],statusLabels[event.status][1])}</b><small>{date(event.created_at)}</small>{typeof event.detail.note==='string'&&event.detail.note&&<p dir="auto">{event.detail.note}</p>}{typeof event.detail.scope==='string'&&<details><summary>{t('متن توافق در این مرحله','Agreement at this step')}</summary><p className="order-prewrap" dir="auto">{event.detail.scope}</p><small>{amount(Number(event.detail.amount))} {currency(String(event.detail.currency))} · {String(event.detail.days)} {t('روز','days')} · {String(event.detail.revisions)} {t('اصلاح','revisions')}</small></details>}</li>)}</ol></section></details>}</aside></div></div>;
}
