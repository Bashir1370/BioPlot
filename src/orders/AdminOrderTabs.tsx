import {useState,type ReactNode} from 'react';
import {useStudioCopy} from './StudioContent';
import {OrderFilePicker} from './OrderFilePicker';
import type {OrderFile,OrderStatus} from './orderModel';

export const orderWorkflowStages:Record<OrderStatus,number>={
 submitted:0,reviewing:0,quoted:1,accepted:2,designing:2,review:3,
 revision_requested:4,approved:5,delivered:3,completed:6,cancelled:7,
};

export const orderWorkflowLabels:[string,string][]=[
 ['ثبت درخواست','Request'],['توافق','Agreement'],['طراحی','Design'],
 ['تحویل','Delivery'],['بازبینی','Revision'],['پرداخت مالی','Payment'],
 ['تکمیل','Complete'],['لغو درخواست','Cancelled'],
];

export function OrderWorkflowTabs({fa,stage,phaseId,visited,busy,children}:{
 fa:boolean;stage:number;phaseId:string;visited:number[];busy:boolean;
 children:(tab:number)=>ReactNode;
}){
 const t=useStudioCopy(fa);
 const [selection,setSelection]=useState<{phaseId:string;tab:number}|null>(null);
 const tab=selection?.phaseId===phaseId?selection.tab:stage;
 return <>
  <nav className="admin-order-tabs" aria-label={t('مراحل سفارش','Order stages')}>
   {orderWorkflowLabels.slice(0,stage===7?8:7).map(([label,en],index)=>
    <button type="button" key={en} disabled={busy||!visited.includes(index)}
     aria-pressed={tab===index} aria-current={stage===index?'step':undefined}
     onClick={()=>setSelection({phaseId,tab:index})}>{t(label,en)}</button>
   )}
  </nav>
  <div className="admin-order-tab-content">{children(tab)}</div>
 </>;
}

export function AdminPreviewForm({fa,busy,staged,onPublish}:{
 fa:boolean;busy:boolean;staged:OrderFile[];onPublish:(files:File[],note:string)=>Promise<boolean>;
}){
 const t=useStudioCopy(fa);
 const [files,setFiles]=useState<File[]>([]);
 const [note,setNote]=useState('');
 return <form className="order-card order-review-stage" onSubmit={async event=>{
  event.preventDefault();
  if(!busy&&(files.length||staged.length)&&await onPublish(files,note.trim())){
   setFiles([]);setNote('');
  }
 }}>
  <h2>{t('ارسال طرح برای بررسی کاربر سایت','Send the design for customer review')}</h2>
  <OrderFilePicker fa={fa} label={t('بارگذاری نسخهٔ قابل بررسی','Upload a review copy')} disabled={busy} onChange={event=>setFiles(Array.from(event.currentTarget.files??[]))}/>
  {[...staged,...files].map((file,index)=><p key={index}><bdi>{file.name}</bdi></p>)}
  <label>{t('پیام همراه طرح','Message to the customer')}
   <textarea rows={3} maxLength={6000} value={note} onChange={event=>setNote(event.currentTarget.value)}/>
  </label>
  <button type="submit" className="order-primary" disabled={busy||!(files.length||staged.length)}>{t('بارگذاری و ارسال طرح','Upload and send design')}</button>
 </form>;
}
