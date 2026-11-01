import {useEffect,useState} from 'react';
const persianDate=new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext',{year:'numeric',month:'numeric',day:'numeric'});
const persianMonth=new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext',{year:'numeric',month:'long'});
const persianLongDate=new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext',{dateStyle:'long'});
const digits=(value:string)=>value.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
function dateParts(date:Date){const parts=Object.fromEntries(persianDate.formatToParts(date).map(part=>[part.type,part.value]));return {year:digits(parts.year||''),month:parts.month||'',day:Number(digits(parts.day||'0'))};}
function monthKey(date:Date){const parts=dateParts(date);return parts.year+'-'+parts.month;}
function startOfPersianMonth(date:Date){const first=new Date(date.getFullYear(),date.getMonth(),date.getDate(),12);for(let i=0;i<32&&dateParts(first).day!==1;i++)first.setDate(first.getDate()-1);return first;}
function localDate(iso:string){const [year,month,day]=iso.split('-').map(Number);return new Date(year,month-1,day,12);}
function toISODate(date:Date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
function nextDate(date:Date,amount:number){const next=new Date(date);next.setDate(next.getDate()+amount);return next;}
function calendarDates(first:Date){const key=monthKey(first),dates:Date[]=[];for(let i=0;i<32;i++){const day=nextDate(first,i);if(monthKey(day)!==key)break;dates.push(day);}return dates;}
export function JalaliDatePicker({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const selected=value?localDate(value):null;
 const [open,setOpen]=useState(false),[shownMonth,setShownMonth]=useState(()=>startOfPersianMonth(selected||new Date()));
 useEffect(()=>{if(selected)setShownMonth(startOfPersianMonth(selected));},[value]);
 const first=startOfPersianMonth(shownMonth),days=calendarDates(first),offset=(first.getDay()+1)%7;
 const cells:(Date|null)[]=[...Array.from({length:offset},()=>null),...days];
 while(cells.length%7)cells.push(null);
 const today=toISODate(new Date());
 const moveMonth=(delta:number)=>{const moved=nextDate(first,delta<0?-1:days.length);setShownMonth(startOfPersianMonth(moved));};
 const choose=(date:Date)=>{onChange(toISODate(date));setOpen(false);};
 return <div className="jalali-date-picker" dir="rtl">
  <button type="button" className="jalali-date-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{selected?persianLongDate.format(selected):'انتخاب تاریخ'}<span aria-hidden="true">▾</span></button>
  {open&&<div className="jalali-calendar" role="dialog" aria-label="انتخاب تاریخ شمسی">
   <div className="jalali-calendar-heading"><button type="button" aria-label="ماه قبل" onClick={()=>moveMonth(-1)}>‹</button><strong>{persianMonth.format(first)}</strong><button type="button" aria-label="ماه بعد" onClick={()=>moveMonth(1)}>›</button></div>
   <div className="jalali-calendar-grid jalali-calendar-weekdays" aria-hidden="true">{['ش','ی','د','س','چ','پ','ج'].map((day,index)=><span key={index}>{day}</span>)}</div>
   <div className="jalali-calendar-grid">{cells.map((date,index)=>date?<button key={toISODate(date)} type="button" aria-label={persianLongDate.format(date)} aria-pressed={toISODate(date)===value} className={toISODate(date)===value?'selected':''} disabled={toISODate(date)<today} onClick={()=>choose(date)}>{new Intl.NumberFormat('fa-IR-u-nu-arabext').format(dateParts(date).day)}</button>:<span key={'empty-'+index} aria-hidden="true"/>)}</div>
  </div>}
 </div>;
}
