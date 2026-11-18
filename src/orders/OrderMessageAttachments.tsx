import {DownloadSimple,Paperclip} from '@phosphor-icons/react';
import {OrderFilePicker} from './OrderFilePicker';
import type {OrderFile} from './orderModel';

export function OrderMessageAttachments({fa,files,busy,canUpload,onUpload,onDownload}:{fa:boolean;files:OrderFile[];busy:boolean;canUpload:boolean;onUpload:(files:File[],kind:OrderFile['kind'])=>Promise<boolean>;onDownload:(file:OrderFile)=>void}){
 const t=(f:string,e:string)=>fa?f:e;
 return <div className="order-message-attachments">
  <h3><Paperclip size={18} aria-hidden="true"/> {t('پیوست‌های گفت‌وگو و رسید پرداخت','Conversation attachments and payment receipts')}</h3>
  {files.map(file=><div className="order-file" key={file.id}><bdi>{file.name}</bdi><button type="button" disabled={busy} onClick={()=>onDownload(file)} aria-label={t('دریافت','Download')+' '+file.name}><DownloadSimple size={18}/>{t('دریافت','Download')}</button></div>)}
  {canUpload&&<><OrderFilePicker fa={fa} label={t('پیوست فایل یا رسید بانکی','Attach a file or bank receipt')} disabled={busy} onChange={event=>{
   const input=event.currentTarget,picked=Array.from(input.files??[]);
   if(picked.length)void onUpload(picked,'reference').then(ok=>{if(ok)input.value='';});
  }}/><p className="order-muted">{t('فایل انتخاب‌شده مستقیماً در همین گفت‌وگو بارگذاری می‌شود. تصویر یا PDF رسید را می‌توانید بفرستید؛ حداکثر ۲۰ مگابایت برای هر فایل.','Selected files upload directly to this conversation. You can send an image or PDF receipt; up to 20 MB per file.')}</p></>}
 </div>;
}
