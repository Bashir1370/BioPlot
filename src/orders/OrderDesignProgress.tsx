import {useEffect,useState} from 'react';
import {Clock,CheckCircle} from '@phosphor-icons/react';
import type {DesignOrder,OrderEvent} from './orderModel';
import {designWindow,remainingDesignTime} from './orderDeliveryTime';
import './order-design-progress.css';

export function OrderDesignProgress({fa,order,events}:{fa:boolean;order:DesignOrder;events:OrderEvent[]}){
 const active=order.status==='accepted'||order.status==='designing';
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{if(!active)return;const update=()=>setNow(Date.now());update();const timer=window.setInterval(update,1000);window.addEventListener('focus',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);};},[active,order.id]);
 if(!active)return null;
 const t=(persian:string,english:string)=>fa?persian:english;
 const schedule=designWindow(order,events);
 const remaining=schedule?remainingDesignTime(schedule.due,now):null;
 const elapsed=schedule?Math.max(0,Math.min(100,(now-schedule.start)/(schedule.due-schedule.start)*100)):0;
 const format=(value:number)=>value.toLocaleString(fa?'fa-IR':'en-US',{minimumIntegerDigits:2,useGrouping:false});
 return <section className={`order-card order-design-progress${remaining?.overdue?' is-overdue':''}`} aria-labelledby="order-design-progress-title">
  <div className="design-progress-heading"><span className="design-progress-icon"><Clock size={28}/></span><div><span className="design-progress-eyebrow">{t('در مسیر خلق تصویر شما','CREATING YOUR VISUAL')}</span><h2 id="order-design-progress-title">{t('طراحی سفارش شما در حال انجام است','Your design is in progress')}</h2></div><span className="design-progress-confirmed"><CheckCircle size={16}/>{t('پیشنهاد تأیید شد','Proposal accepted')}</span></div>
  {remaining&&!remaining.overdue?<>
   <p className="design-countdown-label">{t('زمان باقی‌مانده تا موعد تحویل','Time remaining until delivery')}</p>
   <div className="design-countdown" role="timer" aria-live="off" aria-label={t('شمارش معکوس تحویل سفارش','Delivery countdown')}>{[[remaining.days,t('روز','Days')],[remaining.hours,t('ساعت','Hours')],[remaining.minutes,t('دقیقه','Minutes')]].map(([value,label])=><div key={String(label)}><strong>{format(Number(value))}</strong><span>{label}</span></div>)}</div>
   <div className="design-time-track" role="progressbar" aria-label={t('زمان سپری‌شده از بازه توافق‌شده','Elapsed time in the agreed delivery window')} aria-valuenow={Math.round(elapsed)} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${elapsed}%`}}/></div>
  </>:<p className="design-timing-notice" role="status">{remaining?.overdue?t('موعد اعلام‌شده فرا رسیده است؛ سفارش شما همچنان در حال طراحی است و تیم، وضعیت تحویل را در همین صفحه اعلام می‌کند.','The agreed delivery time has arrived. Your design is still in progress; the team will share a delivery update here.'):t('زمان تحویل پس از ثبت برنامه طراحی در همین بخش نمایش داده می‌شود.','The delivery time will appear here once the design schedule is recorded.')}</p>}
  {schedule&&<p className="design-delivery-date">{t('موعد تحویل: ','Delivery due: ')}<time dateTime={new Date(schedule.due).toISOString()}>{new Date(schedule.due).toLocaleString(fa?'fa-IR':'en-US',{dateStyle:'long',timeStyle:'short'})}</time></p>}
  <div className="design-patience-note"><p>{t('از صبر و شکیبایی شما نهایت سپاس را داریم.','Thank you for your patience.')}</p><span>{t('به‌محض آماده‌شدن سفارش، از همین صفحه به شما اطلاع می‌دهیم.','As soon as your order is ready, we will let you know on this page.')}</span></div>
 </section>;
}
