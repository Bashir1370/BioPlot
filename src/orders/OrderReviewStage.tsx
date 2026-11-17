import type {ReactNode} from 'react';
import {DownloadSimple} from '@phosphor-icons/react';
import {useStudioCopy} from './StudioContent';
import type {OrderFile} from './orderModel';

export function OrderReviewStage({fa,files,busy,onDownload,children}:{
 fa:boolean;
 files:OrderFile[];
 busy:boolean;
 onDownload:(file:OrderFile)=>void;
 children:ReactNode;
}){
 const t=useStudioCopy(fa);
 return <section className="order-card order-review-stage" aria-labelledby="order-review-title">
  <h2 id="order-review-title">{t('طرح شما آمادهٔ بررسی است','Your design is ready to review')}</h2>
  <p>{t('نسخهٔ ارسالی را بررسی کنید. اگر طرح مورد تأیید شماست، به تسویه بروید. برای اصلاح، تغییرات موردنیاز را بنویسید.','Review the submitted design. Approve it to move to settlement, or describe the changes you need.')}</p>
  {files.map(file=><div className="order-file" key={file.id}>
   <bdi>{file.name}</bdi>
   <button type="button" disabled={busy} onClick={()=>onDownload(file)} aria-label={t('دریافت','Download')+' '+file.name}>
    <DownloadSimple aria-hidden="true"/> {t('دریافت طرح','Download design')}
   </button>
  </div>)}
  {children}
 </section>;
}
