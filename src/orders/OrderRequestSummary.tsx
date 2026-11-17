import {AdminOrderOwner} from './AdminOrderOwner';
import type {ReactNode} from 'react';
import {CheckCircle,FileText,DownloadSimple} from '@phosphor-icons/react';
import {serviceLabels,statusLabels,type DesignOrder,type OrderFile} from './orderModel';
import {useStudioCopy} from './StudioContent';
import './order-detail-clean.css';

export function OrderRequestSummary({fa,order,files,busy,onDownload,children,briefOnly=false,showOwner=false}:{fa:boolean;order:DesignOrder;files:OrderFile[];busy:boolean;onDownload:(file:OrderFile)=>void;children?:ReactNode;briefOnly?:boolean;showOwner?:boolean}){
 const t=useStudioCopy(fa);
 const pending=order.status==='submitted'||order.status==='reviewing';
 const references=files.filter(file=>file.kind==='reference');
 const fields=[
  [t('نوع طراحی','Design type'),t(...serviceLabels[order.kind])],
  [t('عنوان درخواست','Request title'),order.title],
  [t('زمان تحویل موردنظر','Preferred delivery date'),order.requested_date?new Date(order.requested_date+'T12:00:00').toLocaleDateString(fa?'fa-IR':'en-US'):null],
  [t('مخاطب','Audience'),order.brief.audience],
  [t('سبک','Style'),order.brief.style],
  [t('الزامات','Requirements'),order.brief.requirements],
 ].filter(([,value])=>Boolean(value));
 return <section className="order-card order-request-summary" aria-labelledby="order-request-summary-title">
  <div className="order-request-confirmation">
   <span className="order-request-check"><CheckCircle size={30} aria-hidden="true"/></span>
   <div><h2 id="order-request-summary-title">{briefOnly?t('اطلاعات درخواست','Request details'):order.status==='submitted'?t('سفارش شما با موفقیت ثبت شد','Your request has been received'):t(...statusLabels[order.status])}</h2>
   {pending&&!briefOnly&&<p>{t('تیم ما در حال بررسی سفارش شماست و به‌زودی نتیجه را در همین صفحه به شما اطلاع می‌دهیم.','Our team is reviewing your request. We will share an update on this page soon.')}</p>}</div>
  </div>
  <dl className="order-request-facts">{showOwner&&<AdminOrderOwner orderId={order.id} fa={fa}/>}{fields.map(([label,value],i)=><div className={`order-request-fact tone-${i%3}`} key={label}><dt>{label}</dt><dd dir="auto">{value}</dd></div>)}
   <div className="order-request-fact order-request-description"><dt>{t('توضیح طرح شما','Your design brief')}</dt><dd dir="auto">{order.brief.message}</dd></div>
  </dl>
  {references.length>0&&<div className="order-request-references"><h3>{t('فایل‌هایی که فرستادید','Your reference files')}</h3><div>{references.map(file=><button type="button" disabled={busy} key={file.id} onClick={()=>onDownload(file)} aria-label={`${t('دریافت','Download')} ${file.name}`}><FileText size={20} aria-hidden="true"/><bdi>{file.name}</bdi><DownloadSimple size={17} aria-hidden="true"/></button>)}</div></div>}
  <div className="order-request-footer"><small>{t('کد پیگیری','Request ID')} <bdi>#{order.id.slice(0,8)}</bdi></small>{children}</div>
 </section>;
}
