// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {it,expect,vi} from 'vitest';
import {OrderMessageAttachments} from './OrderMessageAttachments';
import type {OrderFile} from './orderModel';
it('uploads receipts without a text message and allows downloading existing attachments',async()=>{
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 const upload=vi.fn(async()=>true),download=vi.fn();
 const receipt:OrderFile={id:'receipt',order_id:'order',uploader_id:'owner',kind:'reference',name:'receipt.pdf',path:'private/receipt.pdf',size:123,created_at:'2026-11-18T10:00:00Z'};
 try{
 await act(async()=>root.render(<OrderMessageAttachments fa files={[receipt]} busy={false} canUpload onUpload={upload} onDownload={download} onMessage={async()=>true}/>));
 expect(host.querySelector('form')?.firstElementChild?.textContent).toBe('پیام جدید');
 expect(host.querySelector('form button[type=submit]')?.textContent).toBe('ارسال پیام و رسید بانکی');
 expect(host.querySelector('.order-muted')).toBeNull();
 const picker=host.querySelector<HTMLInputElement>('input[type=file]')!;
 const file=new File(['receipt'],'receipt.pdf',{type:'application/pdf'});
 Object.defineProperty(picker,'files',{value:[file],configurable:true});
 await act(async()=>picker.dispatchEvent(new Event('change',{bubbles:true})));
 expect(upload).not.toHaveBeenCalled();
 await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(upload).toHaveBeenCalledWith([file],'reference');
 await act(async()=>host.querySelector<HTMLButtonElement>('button')!.click());expect(download).toHaveBeenCalledWith(receipt);
 await act(async()=>root.render(<OrderMessageAttachments fa files={[receipt]} busy={false} canUpload={false} onUpload={upload} onDownload={download} onMessage={async()=>true}/>));
 expect(host.querySelector('input')).toBeNull();expect(host.textContent).toContain('receipt.pdf');
 }finally{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();}
});
