import type {DesignOrder,OrderEvent} from './orderModel';
const DAY=86400000;
/** Prefer the server deadline; historical orders use the immutable acceptance event. */
export function designWindow(order:DesignOrder,events:OrderEvent[]){
 const accepted=events.filter(e=>e.status==='accepted').sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0];
 const anchor=accepted??events.filter(e=>e.status==='designing').sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at))[0];
 if(!anchor)return null;
 const start=Date.parse(anchor.created_at);
 const days=Number(anchor.detail.days??order.quote_days);
 const due=typeof anchor.detail.delivery_due_at==='string'?Date.parse(anchor.detail.delivery_due_at):Number.isInteger(days)&&days>0&&days<=365?start+days*DAY:NaN;
 return Number.isFinite(start)&&Number.isFinite(due)&&due>start?{start,due}:null;
}
export function remainingDesignTime(due:number,now:number){
 const minutes=Math.max(0,Math.ceil((due-now)/60000));
 return {days:Math.floor(minutes/1440),hours:Math.floor(minutes%1440/60),minutes:minutes%60,overdue:now>=due};
}
