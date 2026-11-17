import type {DesignOrder,OrderEvent,OrderMessage,OrderStatus} from './orderModel';

export const orderMessageStage:Record<OrderStatus,number>={submitted:0,reviewing:0,quoted:1,accepted:2,designing:2,review:3,approved:4,revision_requested:3,delivered:5,completed:6,cancelled:7};
export interface OrderMessagePhase {id:string;stage:number;status:OrderStatus;startedAt:string;events:OrderEvent[];messages:OrderMessage[];}
/** Consecutive visits to a journey stage form one phase; returning later creates a new phase. */
export function groupOrderMessages(order:DesignOrder,events:OrderEvent[],messages:OrderMessage[],stageFor=orderMessageStage,retainRevisionDuringDesign=false){
 const resolveStage=(status:OrderStatus,previousStage?:number)=>
  retainRevisionDuringDesign&&status==='designing'&&previousStage===stageFor.revision_requested?previousStage:stageFor[status];
 const ordered=events.filter(event=>Number.isFinite(Date.parse(event.created_at))).slice().sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at));
 const groups:OrderMessagePhase[]=[{id:`initial-${order.id}`,stage:ordered.length?0:stageFor[order.status],status:ordered.length?'submitted':order.status,startedAt:order.created_at,events:[],messages:[]}];
 for(const event of ordered){
  const last=groups[groups.length-1],stage=resolveStage(event.status,last.stage);
  if(last.stage===stage){last.status=event.status;last.events.push(event);}
  else groups.push({id:event.id,stage,status:event.status,startedAt:event.created_at,events:[event],messages:[]});
 }
 const last=groups[groups.length-1];
 const currentStage=resolveStage(order.status,last.stage);
 if(last.stage!==currentStage)groups.push({id:`current-${order.id}-${order.status}`,stage:currentStage,status:order.status,startedAt:order.updated_at,events:[],messages:[]});
 for(const message of messages){
  const timestamp=Date.parse(message.created_at);
  let index=groups.length-1;
  while(index>0&&(!Number.isFinite(timestamp)||Date.parse(groups[index].startedAt)>timestamp))index--;
  groups[index].messages.push(message);
 }
 for(const group of groups)group.messages.sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at));
 return {current:groups[groups.length-1],previous:groups.slice(0,-1)};
}
