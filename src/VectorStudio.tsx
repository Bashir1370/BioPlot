import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './vector-studio.css';

type Tool = 'select'|'straight'|'horizontal'|'vertical'|'arrow'|'double-arrow'|'elbow'|'curve'|'wave'|'inhibition'|'freehand';
type Style = 'solid'|'dashed'|'dotted';
type Point = {x:number;y:number};
type Line = {id:string;tool:Exclude<Tool,'select'>;x1:number;y1:number;x2:number;y2:number;color:string;width:number;style:Style;bend:number;points?:Point[]};
type Drag = {id:string;mode:'draw'|'start'|'end'|'move';start:Point;original:Line};
const W=960,H=620;
const TOOLS: Array<[Tool,string,string,string]> = [
  ['select','انتخاب / ویرایش','Select','⌖'],['straight','مستقیم','Straight','╱'],['horizontal','افقی','Horizontal','━'],
  ['vertical','عمودی','Vertical','┃'],['arrow','فلش','Arrow','→'],['double-arrow','دوطرفه','Double arrow','↔'],
  ['elbow','زاویه‌دار','Elbow','┐'],['curve','منحنی بِزیه','Bézier','⌒'],['wave','موجی','Wave','∿'],
  ['inhibition','مهاری','Inhibition','⊣'],['freehand','آزاد','Freehand','✎']
];
const copy=(lines:Line[]):Line[]=>lines.map(line=>({...line,points:line.points?.map(point=>({...point}))}));
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const r=(n:number)=>Math.round(n*10)/10;
const dash=(style:Style)=>style==='dashed'?'12 7':style==='dotted'?'1 8':'';
const libraryUrl='https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.2.8/dist/svg.min.js';
let loader:Promise<() => any>|null=null;
function loadLibrary():Promise<() => any>{
  const factory=(window as unknown as {SVG?:()=>any}).SVG;
  if(typeof factory==='function')return Promise.resolve(factory);
  if(!loader)loader=new Promise<() => any>((resolve,reject)=>{
    const script=document.createElement('script');script.src=libraryUrl;script.async=true;
    script.onload=()=>{const loaded=(window as unknown as {SVG?:()=>any}).SVG;typeof loaded==='function'?resolve(loaded):reject(new Error('SVG.js بارگذاری شد اما آماده نیست.'));};
    script.onerror=()=>reject(new Error('بارگذاری SVG.js ممکن نشد؛ اتصال اینترنت را بررسی کنید.'));
    document.head.append(script);
  }).catch(error=>{loader=null;throw error;});
  return loader;
}
function pathFor(a:Line){
  const {x1,y1,x2,y2,bend}=a;
  if(a.tool==='freehand')return (a.points??[{x:x1,y:y1},{x:x2,y:y2}]).map((p,i)=>`${i?'L':'M'}${r(p.x)} ${r(p.y)}`).join(' ');
  if(a.tool==='elbow')return `M${x1} ${y1} H${r((x1+x2)/2+bend)} V${y2} H${x2}`;
  if(a.tool==='curve')return `M${x1} ${y1} C${r(x1+(x2-x1)*.33)} ${r(y1+bend)} ${r(x1+(x2-x1)*.67)} ${r(y2+bend)} ${x2} ${y2}`;
  if(a.tool==='wave'){
    const dx=x2-x1,dy=y2-y1,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length,amp=bend||22;
    return `M${x1} ${y1} Q${r(x1+dx*.125+nx*amp)} ${r(y1+dy*.125+ny*amp)} ${r(x1+dx*.25)} ${r(y1+dy*.25)} T${r(x1+dx*.5)} ${r(y1+dy*.5)} T${r(x1+dx*.75)} ${r(y1+dy*.75)} T${x2} ${y2}`;
  }
  return `M${x1} ${y1} L${x2} ${y2}`;
}
function head(end:Point,from:Point,size:number){
  const length=Math.max(1,Math.hypot(end.x-from.x,end.y-from.y));
  const ux=(end.x-from.x)/length,uy=(end.y-from.y)/length,px=-uy,py=ux;
  return `${r(end.x)},${r(end.y)} ${r(end.x-ux*size+px*size*.43)},${r(end.y-uy*size+py*size*.43)} ${r(end.x-ux*size-px*size*.43)},${r(end.y-uy*size-py*size*.43)}`;
}
function paint(svg:any,lines:Line[],selected:string|null,handles:boolean){
  svg.clear();
  for(const a of lines){
    svg.path(pathFor(a)).fill('none').stroke({color:a.color,width:a.width,linecap:'round',linejoin:'round'}).attr({'stroke-dasharray':dash(a.style),'data-line-id':a.id,cursor:handles?'move':'default'});
    const size=Math.max(12,a.width*3.5);
    const near=a.tool==='elbow'?{x:a.x2+(a.x2>=(a.x1+a.x2)/2+a.bend?-12:12),y:a.y2}:{x:a.x1,y:a.y1};
    if(a.tool==='arrow'||a.tool==='double-arrow')svg.polygon(head({x:a.x2,y:a.y2},near,size)).fill(a.color).attr({'data-line-id':a.id});
    if(a.tool==='double-arrow')svg.polygon(head({x:a.x1,y:a.y1},{x:a.x2,y:a.y2},size)).fill(a.color).attr({'data-line-id':a.id});
    if(a.tool==='inhibition'){
      const dx=a.x2-a.x1,dy=a.y2-a.y1,len=Math.max(1,Math.hypot(dx,dy)),nx=-dy/len,ny=dx/len,span=Math.max(10,a.width*3);
      svg.path(`M${r(a.x2+nx*span)} ${r(a.y2+ny*span)} L${r(a.x2-nx*span)} ${r(a.y2-ny*span)}`).fill('none').stroke({color:a.color,width:a.width,linecap:'round'}).attr({'data-line-id':a.id});
    }
    if(handles&&selected===a.id)for(const [edge,x,y] of [['start',a.x1,a.y1],['end',a.x2,a.y2]] as const){
      svg.circle(13).fill('#fff').stroke({color:'#067f79',width:2}).center(x,y).attr({'data-line-id':a.id,'data-edge':edge,cursor:'crosshair'});
    }
  }
}
function locationOf(event:PointerEvent):Point{
  const element=event.currentTarget as SVGSVGElement,rect=element.getBoundingClientRect();
  return {x:r(clamp((event.clientX-rect.left)*W/rect.width,0,W)),y:r(clamp((event.clientY-rect.top)*H/rect.height,0,H))};
}
export function VectorStudio(){
  const [mount,setMount]=useState<Element|null>(null),[showButton,setShowButton]=useState(false),[open,setOpen]=useState(false);
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
  const [tool,setTool]=useState<Tool>('straight'),[color,setColor]=useState('#087f79'),[width,setWidth]=useState(4),[style,setStyle]=useState<Style>('solid');
  const [lines,setLines]=useState<Line[]>([]),[selected,setSelected]=useState<string|null>(null);
  const host=useRef<HTMLDivElement>(null),svgRef=useRef<any>(null),linesRef=useRef<Line[]>([]),dragRef=useRef<Drag|null>(null);
  const undoRef=useRef<Line[][]>([]),redoRef=useRef<Line[][]>([]),handlers=useRef<{down:(e:PointerEvent)=>void;move:(e:PointerEvent)=>void;up:(e:PointerEvent)=>void}>({down:()=>{},move:()=>{},up:()=>{}});
  const active=lines.find(line=>line.id===selected);
  const apply=(next:Line[])=>{linesRef.current=next;setLines(next);};
  const remember=()=>{undoRef.current.push(copy(linesRef.current));if(undoRef.current.length>80)undoRef.current.shift();redoRef.current=[];};
  const undo=()=>{const before=undoRef.current.pop();if(!before)return;redoRef.current.push(copy(linesRef.current));apply(before);setSelected(null);};
  const redo=()=>{const after=redoRef.current.pop();if(!after)return;undoRef.current.push(copy(linesRef.current));apply(after);setSelected(null);};
  const edit=(id:string,change:(line:Line)=>Line)=>apply(linesRef.current.map(line=>line.id===id?change(line):line));
  useEffect(()=>{
    const sync=()=>{
      const header=document.querySelector('.studio-library .studio-panel-heading') as HTMLElement|null;
      const visible=!!header&&!header.closest('.studio-library')?.classList.contains('collapsed')&&/Lines|خطوط/i.test(header.querySelector('h2')?.textContent??'');
      if(header)header.style.flexWrap=visible?'wrap':'';
      setMount(previous=>previous===header?previous:header);
      setShowButton(previous=>previous===visible?previous:visible);
    };
    sync();const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!open)return;
    let cancelled=false;setReady(false);setError('');
    void loadLibrary().then(factory=>{
      if(cancelled||!host.current)return;
      const svg=factory().addTo(host.current).size('100%','100%').viewbox(0,0,W,H);
      svg.node.style.touchAction='none';
      svg.node.addEventListener('pointerdown',(e:PointerEvent)=>handlers.current.down(e));
      svg.node.addEventListener('pointermove',(e:PointerEvent)=>handlers.current.move(e));
      svg.node.addEventListener('pointerup',(e:PointerEvent)=>handlers.current.up(e));
      svg.node.addEventListener('pointercancel',(e:PointerEvent)=>handlers.current.up(e));
      svgRef.current=svg;setReady(true);
    }).catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:'بارگذاری ابزار ممکن نشد.');});
    return()=>{cancelled=true;svgRef.current=null;host.current?.replaceChildren();};
  },[open]);
  useEffect(()=>{if(ready&&svgRef.current){svgRef.current.size('100%','100%').viewbox(0,0,W,H);paint(svgRef.current,lines,selected,true);}},[ready,lines,selected]);
  useEffect(()=>{
    if(!open)return;
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);return;}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();undo();}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();redo();}};
    window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);
  },[open]);
  const down=(event:PointerEvent)=>{
    if(!ready||event.button!==0)return;event.preventDefault();
    const point=locationOf(event),target=event.target instanceof Element?event.target.closest('[data-line-id]'):null,id=target?.getAttribute('data-line-id')??null;
    if(tool==='select'){
      setSelected(id);if(!id)return;const original=linesRef.current.find(line=>line.id===id);if(!original)return;
      remember();const edge=target?.getAttribute('data-edge');dragRef.current={id,mode:edge==='start'?'start':edge==='end'?'end':'move',start:point,original:copy([original])[0]};
    }else{
      remember();const id=`line_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
      const line:Line={id,tool,x1:point.x,y1:point.y,x2:point.x,y2:point.y,color,width,style,bend:tool==='wave'?22:0,points:tool==='freehand'?[point]:undefined};
      apply([...linesRef.current,line]);setSelected(id);dragRef.current={id,mode:'draw',start:point,original:line};
    }
    (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
  };
  const move=(event:PointerEvent)=>{
    const drag=dragRef.current;if(!drag)return;
    const point=locationOf(event),dx=point.x-drag.start.x,dy=point.y-drag.start.y;
    edit(drag.id,line=>{
      if(drag.mode==='move')return {...drag.original,x1:r(drag.original.x1+dx),x2:r(drag.original.x2+dx),y1:r(drag.original.y1+dy),y2:r(drag.original.y2+dy),points:drag.original.points?.map(p=>({x:r(p.x+dx),y:r(p.y+dy)}))};
      if(drag.mode==='start')return {...line,x1:point.x,y1:point.y,points:line.points?.map((p,i)=>i? p:point)};
      if(drag.mode==='end')return {...line,x2:point.x,y2:point.y,points:line.points?.map((p,i,all)=>i===all.length-1?point:p)};
      if(line.tool==='freehand'){const points=line.points??[],last=points[points.length-1];return !last||Math.hypot(last.x-point.x,last.y-point.y)>2?{...line,x2:point.x,y2:point.y,points:[...points,point]}:line;}
      return {...line,x2:line.tool==='vertical'?line.x1:point.x,y2:line.tool==='horizontal'?line.y1:point.y};
    });
  };
  const up=(event:PointerEvent)=>{
    const drag=dragRef.current;if(!drag)return;dragRef.current=null;
    const target=event.currentTarget as SVGSVGElement;if(target.hasPointerCapture(event.pointerId))target.releasePointerCapture(event.pointerId);
    const line=linesRef.current.find(item=>item.id===drag.id);
    if(drag.mode==='draw'&&line&&Math.hypot(line.x2-line.x1,line.y2-line.y1)<4){apply(linesRef.current.filter(item=>item.id!==drag.id));setSelected(null);}
  };
  handlers.current={down,move,up};
  const property=(patch:Partial<Line>)=>{if(!selected)return;remember();edit(selected,line=>({...line,...patch}));};
  const insert=async()=>{
    const svg=svgRef.current,current=linesRef.current;if(!svg||!current.length)return;setStatus('');
    const points=current.flatMap(line=>[{x:line.x1,y:line.y1},{x:line.x2,y:line.y2},...(line.points??[])]);
    const x=Math.min(...points.map(p=>p.x))-45,y=Math.min(...points.map(p=>p.y))-45;
    const right=Math.max(...points.map(p=>p.x))+45,bottom=Math.max(...points.map(p=>p.y))+45;
    paint(svg,current,null,false);svg.size(right-x,bottom-y).viewbox(x,y,right-x,bottom-y);
    const markup=new XMLSerializer().serializeToString(svg.node);
    svg.size('100%','100%').viewbox(0,0,W,H);paint(svg,current,selected,true);
    const button=[...document.querySelectorAll<HTMLButtonElement>('.reference-tool-rail button')].find(b=>/Uploads|آپلود/i.test(b.textContent??''));
    if(!button){setStatus('دکمه آپلود ویرایشگر پیدا نشد.');return;}button.click();
    let input:HTMLInputElement|null=null;
    for(let i=0;i<12;i++){await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));input=document.querySelector<HTMLInputElement>('.studio-upload input[type="file"][accept*=".svg"]');if(input)break;}
    if(!input){setStatus('آپلود آماده نشد؛ دوباره تلاش کنید.');return;}
    try{const files=new DataTransfer();files.items.add(new File([markup],'BioPlot-Vector-Lines.svg',{type:'image/svg+xml'}));input.files=files.files;input.dispatchEvent(new Event('change',{bubbles:true}));setOpen(false);}
    catch{setStatus('افزودن خطوط به بوم ممکن نشد.');}
  };
  return <>
    {showButton&&mount&&createPortal(<button type="button" className="bp-vector-launch" style={{flexBasis:'100%',justifyContent:'center'}} onClick={()=>setOpen(true)}>✎ <span>Vector Studio</span><small>ابزار پیشرفته خطوط</small></button>,mount)}
    {open&&createPortal(<div className="bp-vector-backdrop" onPointerDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}><section role="dialog" aria-modal="true" aria-label="SVG.js Vector Studio" className="bp-vector-modal" dir="rtl">
      <header className="bp-vector-top"><div><strong>Vector Studio <span>SVG.js</span></strong><p>طراحی خطوط و مسیرهای برداری علمی</p></div><div><button type="button" onClick={undo} disabled={!undoRef.current.length}>↶ واگرد</button><button type="button" onClick={redo} disabled={!redoRef.current.length}>↷ ازنو</button><button type="button" aria-label="بستن" onClick={()=>setOpen(false)}>✕</button></div></header>
      <div className="bp-vector-layout"><aside className="bp-vector-tools"><strong>ابزارهای رسم</strong><div className="bp-vector-tool-grid">{TOOLS.map(([id,fa,en,icon])=><button key={id} type="button" className={tool===id?'active':''} aria-pressed={tool===id} onClick={()=>{setTool(id);if(id!=='select')setSelected(null);}}><b>{icon}</b><span>{fa}</span><small>{en}</small></button>)}</div></aside>
        <div className="bp-vector-workspace"><div className="bp-vector-canvas-head"><span>بوم SVG · 960 × 620</span><span>{lines.length} خط</span></div><div className="bp-vector-canvas" ref={host}/>{error&&<p className="bp-vector-status">{error}</p>}{!ready&&!error&&<p className="bp-vector-hint">در حال بارگذاری SVG.js…</p>}<p className="bp-vector-hint">ابزار را انتخاب کرده و روی بوم بکشید. با ابزار انتخاب، خط و دو سر آن جابه‌جا می‌شوند.</p></div>
        <aside className="bp-vector-properties"><strong>تنظیمات خط</strong><label>رنگ<input type="color" value={active?.color??color} onChange={e=>active?property({color:e.target.value}):setColor(e.target.value)}/></label><label>ضخامت<input type="range" min="1" max="20" value={active?.width??width} onChange={e=>active?property({width:Number(e.target.value)}):setWidth(Number(e.target.value))}/><span>{active?.width??width} px</span></label><label>سبک خط<select value={active?.style??style} onChange={e=>active?property({style:e.target.value as Style}):setStyle(e.target.value as Style)}><option value="solid">پیوسته</option><option value="dashed">خط‌چین</option><option value="dotted">نقطه‌چین</option></select></label>{active&&['curve','wave','elbow'].includes(active.tool)&&<label>انحنا / زاویه<input type="range" min="-180" max="180" value={active.bend} onChange={e=>property({bend:Number(e.target.value)})}/></label>}{active&&<button type="button" className="bp-vector-delete" onClick={()=>{remember();apply(linesRef.current.filter(item=>item.id!==selected));setSelected(null);}}>حذف خط انتخاب‌شده</button>}<p>خروجی SVG برداری است. برای ویرایش گره‌ها از همین پنجره استفاده کنید.</p></aside>
      </div><footer className="bp-vector-footer"><span>{status||'خروجی به‌صورت یک شیء برداری به بوم و کتابخانه اضافه می‌شود؛ تصاویر فعلی حفظ می‌شوند.'}</span><button type="button" disabled={!lines.length} onClick={()=>{if(confirm('تمام خطوط پاک شوند؟')){remember();apply([]);setSelected(null);}}}>پاک‌سازی</button><button type="button" className="bp-vector-add" disabled={!ready||!lines.length} onClick={()=>void insert()}>افزودن به بوم ←</button></footer>
    </section></div>,document.body)}
  </>;
}
