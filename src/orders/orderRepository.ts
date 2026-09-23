import {supabase} from '../supabaseClient';
import {validateOrderFile,type DesignOrder,type OrderBrief,type OrderEvent,type OrderFile,type OrderMessage,type OrderStatus,type Quote,type ServiceKind} from './orderModel';
const bucket='bioplot-order-files';
function check(error:unknown){if(error)throw error;}
export async function listOrders(ownerId?:string){let request=supabase.from('design_orders').select('*').order('updated_at',{ascending:false}).limit(200);if(ownerId)request=request.eq('user_id',ownerId);const {data,error}=await request;check(error);return data as DesignOrder[];}
export async function loadOrder(id:string){
 const results=await Promise.all([supabase.from('design_orders').select('*').eq('id',id).single(),supabase.from('design_order_files').select('*').eq('order_id',id).order('created_at',{ascending:false}),supabase.from('design_order_messages').select('*').eq('order_id',id).order('created_at'),supabase.from('design_order_events').select('*').eq('order_id',id).order('created_at')]);
 results.forEach(result=>check(result.error));return {order:results[0].data as DesignOrder,files:results[1].data as OrderFile[],messages:results[2].data as OrderMessage[],events:results[3].data as OrderEvent[]};
}
export async function createOrder(input:{id:string;title:string;kind:ServiceKind;brief:OrderBrief;requested_date:string|null}){
 const {data,error}=await supabase.rpc('create_design_order',{p_id:input.id,p_title:input.title,p_kind:input.kind,p_brief:input.brief,p_requested_date:input.requested_date});check(error);return data as DesignOrder;
}
export async function transitionOrder(order:DesignOrder,status:OrderStatus,note='',quote?:Quote){const {error}=await supabase.rpc('advance_design_order',{p_id:order.id,p_expected_updated_at:order.updated_at,p_status:status,p_note:note,p_quote:quote??null});check(error);}
export async function sendOrderMessage(orderId:string,userId:string,body:string){const {error}=await supabase.from('design_order_messages').insert({order_id:orderId,author_id:userId,body:body.trim()});check(error);}
export async function uploadOrderFile(orderId:string,userId:string,file:File,kind:OrderFile['kind']){
 if(!validateOrderFile(file))throw new Error('FILE_INVALID');
 const id=crypto.randomUUID(),extension=file.name.split('.').pop()!.toLowerCase(),path=`${orderId}/${userId}/${id}.${extension}`;
 const {error:uploadError}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});check(uploadError);
 const {error}=await supabase.from('design_order_files').insert({id,order_id:orderId,uploader_id:userId,kind,name:file.name.length>200?`${file.name.slice(0,190)}.${extension}`:file.name,path,size:file.size});
 if(error){await supabase.storage.from(bucket).remove([path]);throw error;}
}
export async function downloadOrderFile(file:OrderFile){const {data,error}=await supabase.storage.from(bucket).createSignedUrl(file.path,60,{download:file.name});check(error);if(!data)throw new Error('DOWNLOAD_FAILED');const link=document.createElement('a');link.href=data.signedUrl;link.rel='noopener';link.target='_blank';link.click();}
export function orderError(error:unknown,fa:boolean){
 const code=String((error as {code?:string})?.code??'');const message=String((error as {message?:string})?.message??'');
 if(['42P01','PGRST202','PGRST205'].includes(code))return fa?'سامانه سفارش هنوز فعال نشده است. لطفاً کمی بعد دوباره مراجعه کنید.':'Ordering is not available yet. Please try again later.';
 if(message.includes('ORDER_CHANGED'))return fa?'این سفارش به‌روزرسانی شده است. تازه‌سازی کنید و دوباره تلاش کنید.':'This order changed. Refresh before trying again.';
 if(message.includes('FILES_REQUIRED'))return fa?'ابتدا فایل مربوط به پیش‌نمایش یا تحویل نهایی را بارگذاری کنید.':'Upload the preview or final files first.';
 if(message.includes('FILE_INVALID'))return fa?'فایل باید یکی از قالب‌های مجاز و حداکثر ۲۰ مگابایت باشد.':'Choose a supported file up to 20 MB.';
 return fa?'عملیات انجام نشد. اتصال را بررسی کنید و دوباره تلاش کنید؛ اطلاعات فرم حفظ شده است.':'This action failed. Check your connection and retry; your form is preserved.';
}
