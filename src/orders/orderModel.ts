export const serviceKinds = ['figure','graphical_abstract','poster'] as const;
export type ServiceKind = typeof serviceKinds[number];
export const statuses = ['submitted','reviewing','quoted','accepted','designing','review','approved','revision_requested','delivered','completed','cancelled'] as const;
export type OrderStatus = typeof statuses[number];
export const statusLabels:Record<OrderStatus,[string,string]>={submitted:['ثبت درخواست','Submitted'],reviewing:['بررسی تیم','Team review'],quoted:['منتظر تأیید پیشنهاد','Quote ready'],accepted:['پیشنهاد تأیید شد','Quote accepted'],designing:['در حال طراحی','Designing'],review:['منتظر نظر شما','Preview ready'],approved:['طرح تأیید شد','Design approved'],revision_requested:['درخواست اصلاح','Revision requested'],delivered:['فایل نهایی آماده است','Delivered'],completed:['تکمیل‌شده','Completed'],cancelled:['لغوشده','Cancelled']};
export const serviceLabels:Record<ServiceKind,[string,string]>={figure:['تصویر علمی','Scientific illustration'],graphical_abstract:['چکیده تصویری','Graphical abstract'],poster:['پوستر علمی','Scientific poster']};
export interface OrderBrief {route:'idea'|'reference'|'polish';message:string;audience:string;requirements:string;style:string;formats:string[];sourceProject?:string;}
export interface DesignOrder {id:string;user_id:string;title:string;kind:ServiceKind;brief:OrderBrief;requested_date:string|null;status:OrderStatus;quote_amount:number|null;quote_currency:'IRT'|'USD'|'EUR'|null;quote_scope:string|null;quote_days:number|null;quote_revisions:number|null;revision_round:number;created_at:string;updated_at:string;}
export interface OrderFile {id:string;order_id:string;uploader_id:string;kind:'reference'|'preview'|'final';name:string;path:string;size:number;created_at:string;}
export interface OrderMessage {id:string;order_id:string;author_id:string;body:string;created_at:string;}
export interface OrderEvent {id:string;order_id:string;actor_id:string;status:OrderStatus;detail:Record<string,unknown>;created_at:string;}
export interface Quote {amount:number;currency:'IRT'|'USD'|'EUR';scope:string;days:number;revisions:number;}
export const adminTransitions:Partial<Record<OrderStatus,OrderStatus[]>>={submitted:['reviewing','cancelled'],reviewing:['quoted','cancelled'],quoted:['reviewing','cancelled'],accepted:['designing'],designing:['review'],approved:['delivered'],revision_requested:['designing','quoted'],delivered:['completed']};
export const customerTransitions:Partial<Record<OrderStatus,OrderStatus[]>>={submitted:['cancelled'],reviewing:['cancelled'],quoted:['accepted','cancelled'],review:['approved','revision_requested'],delivered:['revision_requested','completed']};
export function allowedTransitions(status:OrderStatus,admin:boolean){return (admin?adminTransitions:customerTransitions)[status]??[];}
export const MAX_FILE_SIZE=20*1024*1024;
export const FILE_ACCEPT='.pdf,.png,.jpg,.jpeg,.webp,.svg,.pptx,.docx,.zip';
export function validateOrderFile(file:{name:string;size:number}){return file.size>0&&file.size<=MAX_FILE_SIZE&&/\.(pdf|png|jpe?g|webp|svg|pptx|docx|zip)$/i.test(file.name);}
export function validBrief(title:string,brief:OrderBrief){return title.trim().length>=3&&title.trim().length<=160&&brief.message.trim().length>=20&&brief.message.length<=12000&&brief.formats.length>0;}
export function orderReturnPath(next:string|null){return next==='orders'?'/orders':next==='orders_new'?'/orders?new=1':next==='admin_orders'?'/admin/orders':next==='dashboard'?'/dashboard':null;}
