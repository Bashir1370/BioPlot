import {useState,type FormEvent} from 'react';
import {DownloadSimple} from '@phosphor-icons/react';
import {OrderFilePicker} from './OrderFilePicker';
import type {OrderFile} from './orderModel';

export function OrderMessageAttachments({fa,files,busy,canUpload,onUpload,onDownload,onMessage}:{fa:boolean;files:OrderFile[];busy:boolean;canUpload:boolean;onUpload:(files:File[],kind:OrderFile['kind'])=>Promise<boolean>;onDownload:(file:OrderFile)=>void;onMessage:(message:string)=>Promise<boolean>}){
 const t=(f:string,e:string)=>fa?f:e;
 const [message,setMessage]=useState(''),[pending,setPending]=useState<File[]>([]),[sending,setSending]=useState(false);
 const locked=busy||sending;
 async function submit(event:FormEvent){
  event.preventDefault();if(locked||!message.trim()&&!pending.length)return;
  setSending(true);
  try{
   for(const file of pending){
    if(!await onUpload([file],'reference'))return;
    setPending(current=>current.filter(item=>item!==file));
   }
   if(message.trim()&&await onMessage(message.trim()))setMessage('');
  }finally{setSending(false);}
 }
 return <div className="order-message-attachments">
  {files.map(file=><div className="order-file" key={file.id}><bdi>{file.name}</bdi><button type="button" disabled={locked} onClick={()=>onDownload(file)} aria-label={t('دریافت','Download')+' '+file.name}><DownloadSimple size={18}/>{t('دریافت','Download')}</button></div>)}
  {canUpload&&<form onSubmit={submit}>
   <label>{t('پیام جدید','New message')}<textarea rows={3} maxLength={6000} value={message} disabled={locked} onChange={event=>setMessage(event.target.value)}/></label>
   <OrderFilePicker fa={fa} label={t('اضافه کردن رسید بانکی','Add bank receipt')} disabled={locked} onChange={event=>{
    setPending(Array.from(event.currentTarget.files??[]));event.currentTarget.value='';
   }}/>
   {pending.map((file,i)=><div className="order-picked-file" key={i}><bdi>{file.name}</bdi><button type="button" disabled={locked} onClick={()=>setPending(current=>current.filter((_,index)=>index!==i))}>{t('حذف','Remove')}</button></div>)}
   <button className="order-primary" type="submit" disabled={locked||!message.trim()&&!pending.length}>{t('ارسال پیام و رسید بانکی','Send message and bank receipt')}</button>
  </form>}
 </div>;
}
