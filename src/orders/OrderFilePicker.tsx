import type {ChangeEventHandler} from 'react';
import {UploadSimple} from '@phosphor-icons/react';
import {FILE_ACCEPT} from './orderModel';
export function OrderFilePicker({fa,label,disabled,onChange}:{fa:boolean;label:string;disabled?:boolean;onChange:ChangeEventHandler<HTMLInputElement>}){
 return <label className="order-file-picker"><span>{label}</span><span className="order-file-picker-button"><UploadSimple/>{fa?'انتخاب فایل‌ها':'Choose files'}<input aria-label={label} disabled={disabled} type="file" multiple accept={FILE_ACCEPT} onChange={onChange}/></span></label>;
}
