import { useEffect, useRef, useState } from 'react';
import { sanitizeSvg } from './assets';
import { deletePathNode, insertPathNode, movePathHandle, parsePath, pathHandles, pathString, primitivePath, type NodeHandle } from './vectorNodes';
import './svg-template-editor.css';
import { describeSvgComponents, svgComponentName, type SvgComponentRow } from './svgComponentLabels';

const NS='http://www.w3.org/2000/svg';
const graphics='path,rect,circle,ellipse,polygon,polyline,line,text,image,use,g';
const excluded='defs,clipPath,mask,marker,pattern,symbol';
type EditorState={undo:boolean;redo:boolean;name:string;nodes:boolean;node:boolean;count:number;layers:SvgComponentRow[]};
const empty:EditorState={undo:false,redo:false,name:'',nodes:false,node:false,count:0,layers:[]};

/** Draft-only DOM editing: Apply is one atomic document command; Cancel changes nothing. */
export class SvgEditingSession {
  root:SVGSVGElement;
  overlay:SVGSVGElement;
  selected:SVGGraphicsElement[]=[];
  nodes=false;
  node:NodeHandle|null=null;
  history:string[]=[];
  index=0;
  private cleanupDrag:(()=>void)|null=null;
  constructor(private doc:Document,source:string,private changed:(state:EditorState)=>void){
    const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
    this.root=doc.importNode(parsed.documentElement,true) as unknown as SVGSVGElement;
    if(!this.root.hasAttribute('viewBox')){
      const w=parseFloat(this.root.getAttribute('width')??'300')||300,h=parseFloat(this.root.getAttribute('height')??'150')||150;
      this.root.setAttribute('viewBox',`0 0 ${w} ${h}`);
    }
    this.overlay=doc.createElementNS(NS,'svg');this.overlay.classList.add('node-overlay');
    doc.body.replaceChildren(this.root,this.overlay);
    this.history=[this.serialize()];
    doc.addEventListener('pointerdown',this.pointerDown);
    doc.addEventListener('keydown',this.keyDown);
    doc.defaultView?.addEventListener('resize',this.refresh);
    this.refresh();
  }
  serialize=()=>new XMLSerializer().serializeToString(this.root);
  dispose(){this.cleanupDrag?.();this.doc.removeEventListener('pointerdown',this.pointerDown);this.doc.removeEventListener('keydown',this.keyDown);this.doc.defaultView?.removeEventListener('resize',this.refresh);}
  checkpoint(){const value=this.serialize();if(value!==this.history[this.index]){this.history=this.history.slice(0,this.index+1);this.history.push(value);this.index++;}this.refresh();}
  restore(delta:number){const index=this.index+delta;if(index<0||index>=this.history.length)return;this.cleanupDrag?.();this.index=index;const parsed=new DOMParser().parseFromString(this.history[index],'image/svg+xml');const root=this.doc.importNode(parsed.documentElement,true) as unknown as SVGSVGElement;this.root.replaceWith(root);this.root=root;this.selected=[];this.nodes=false;this.node=null;this.refresh();}
  pick(element:Element,additive=false){
    const item=element as SVGGraphicsElement;
    this.selected=additive?(this.selected.includes(item)?this.selected.filter(e=>e!==item):[...this.selected.filter(e=>!e.contains(item)&&!item.contains(e)),item]):[item];
    this.nodes=false;this.node=null;this.refresh();
  }
  private screenPoint(element:SVGGraphicsElement,x:number,y:number){return new DOMPoint(x,y).matrixTransform(element.getScreenCTM()!);}
  private localPoint(element:SVGGraphicsElement,x:number,y:number){const matrix=element.getScreenCTM();if(!matrix||Math.abs(matrix.a*matrix.d-matrix.b*matrix.c)<1e-12)throw new Error('This transform cannot be edited');return new DOMPoint(x,y).matrixTransform(matrix.inverse());}
  refresh=()=>{
    this.overlay.replaceChildren();
    const add=(tag:string,attrs:Record<string,string>)=>{const element=this.doc.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>element.setAttribute(k,v));this.overlay.append(element);return element;};
    for(const element of this.selected){const r=element.getBoundingClientRect();add('rect',{x:String(r.x),y:String(r.y),width:String(r.width),height:String(r.height),fill:'none',stroke:'#07857d','stroke-width':'1','stroke-dasharray':'4 3'});}
    if(this.nodes&&this.selected.length===1){
      const element=this.selected[0];
      const handles=pathHandles(parsePath(element.getAttribute('d')??''));
      for(const [i,h] of handles.entries()){
        const p=this.screenPoint(element,h.x,h.y);
        add('circle',{cx:String(p.x),cy:String(p.y),r:h.control?'4':'5',fill:this.node?.segment===h.segment&&this.node.offset===h.offset?'#07857d':h.control?'#dcf3ed':'white',stroke:'#07857d','stroke-width':'1.5','data-handle':String(i),tabindex:'0',role:'button','aria-label':`${h.control?'Control':'Node'} ${h.segment+1}`,style:'pointer-events:all;cursor:move'});
      }
    }
    const layers=Array.from(this.root.querySelectorAll(graphics)).filter(e=>!e.closest(excluded));
    this.changed({undo:this.index>0,redo:this.index<this.history.length-1,name:this.selected.map(e=>e.getAttribute('aria-label')||e.id||e.localName).join(', '),nodes:this.nodes,node:!!this.node&&!this.node.control,count:this.selected.length,layers:describeSvgComponents(layers,this.selected)});
  };
  private pointerDown=(event:PointerEvent)=>{
    if(event.button!==0)return;
    const target=event.target as Element;
    const handle=target.getAttribute?.('data-handle');
    if(handle!==null&&handle!==undefined&&this.nodes){
      const element=this.selected[0],segments=parsePath(element.getAttribute('d')??''),node=pathHandles(segments)[Number(handle)];
      this.node=node;this.refresh();
      const start=this.localPoint(element,event.clientX,event.clientY);
      this.drag(event,p=>{const next=this.localPoint(element,p.clientX,p.clientY);element.setAttribute('d',pathString(movePathHandle(segments,node,node.x+next.x-start.x,node.y+next.y-start.y)));});return;
    }
    const element=target.closest?.(graphics) as SVGGraphicsElement|null;
    if(!element||!this.root.contains(element)||element.closest(excluded)){this.selected=[];this.nodes=false;this.node=null;this.refresh();return;}
    if(!this.selected.includes(element)||event.shiftKey)this.pick(element,event.shiftKey);
    if(event.shiftKey)return;
    const initial=this.selected.map(e=>({element:e,transform:e.getAttribute('transform')??'',parent:e.parentElement as unknown as SVGGraphicsElement}));
    const origins=initial.map(s=>this.localPoint(s.parent,event.clientX,event.clientY));
    this.drag(event,p=>initial.forEach((s,i)=>{const next=this.localPoint(s.parent,p.clientX,p.clientY),dx=next.x-origins[i].x,dy=next.y-origins[i].y;s.element.setAttribute('transform',`translate(${dx} ${dy}) ${s.transform}`);}));
  };
  private drag(event:PointerEvent,move:(event:PointerEvent)=>void){
    event.preventDefault();const before=this.serialize();let moved=false;
    const onMove=(e:PointerEvent)=>{if(e.pointerId!==event.pointerId)return;move(e);moved=true;this.refresh();};
    const stop=()=>{this.doc.removeEventListener('pointermove',onMove);this.doc.removeEventListener('pointerup',up);this.doc.removeEventListener('pointercancel',cancel);this.cleanupDrag=null;};
    const up=(e:PointerEvent)=>{if(e.pointerId!==event.pointerId)return;stop();if(moved)this.checkpoint();};
    const cancel=()=>{stop();if(moved){const parsed=new DOMParser().parseFromString(before,'image/svg+xml');const root=this.doc.importNode(parsed.documentElement,true) as unknown as SVGSVGElement;this.root.replaceWith(root);this.root=root;this.selected=[];this.nodes=false;this.refresh();}};
    this.cleanupDrag=cancel;
    this.root.setPointerCapture?.(event.pointerId);
    this.doc.addEventListener('pointermove',onMove);this.doc.addEventListener('pointerup',up);this.doc.addEventListener('pointercancel',cancel);
  }
  private keyDown=(e:KeyboardEvent)=>{
    if(e.ctrlKey||e.metaKey){if(e.key.toLowerCase()==='z'){e.preventDefault();this.restore(e.shiftKey?1:-1);}return;}
    if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();if(this.nodes)this.removeNode();else this.remove();}
    if(e.key==='Escape'){this.nodes=false;this.node=null;this.selected=[];this.refresh();}
  };
  remove(){this.selected.forEach(e=>e.remove());this.selected=[];this.nodes=false;this.node=null;this.checkpoint();}
  removeNode(){if(!this.node||this.node.control||!this.nodes)return;const element=this.selected[0];element.setAttribute('d',pathString(deletePathNode(parsePath(element.getAttribute('d')??''),this.node.segment)));this.node=null;this.checkpoint();}
  addNode(){if(!this.node||this.node.control||!this.nodes)return;const element=this.selected[0];const before=parsePath(element.getAttribute('d')??'');const next=insertPathNode(before,this.node.segment);if(next===before)throw new Error('Choose a vertex before a line or Bézier segment. Arc splitting is not supported.');element.setAttribute('d',pathString(next));this.node=null;this.checkpoint();}
  enterNodes(){
    if(this.nodes){this.nodes=false;this.node=null;this.refresh();return;}
    if(this.selected.length!==1)return;
    const old=this.selected[0],d=primitivePath(old);if(d===null)throw new Error('Select a path or geometric shape. Images, text and groups do not have editable path nodes.');
    const path=this.doc.createElementNS(NS,'path');
    const geometry=new Set(['x','y','width','height','rx','ry','cx','cy','r','x1','x2','y1','y2','points','d']);
    Array.from(old.attributes).forEach(a=>{if(!geometry.has(a.name))path.setAttribute(a.name,a.value);});
    path.setAttribute('d',pathString(parsePath(d)));old.replaceWith(path);this.selected=[path];this.nodes=true;this.node=null;this.checkpoint();
  }
  paint(property:'fill'|'stroke',value:string){for(const e of this.selected){e.style.setProperty(property,value);e.setAttribute(property,value);}this.checkpoint();}
  reorder(front:boolean){for(const e of this.selected){const parent=e.parentNode!;if(front)parent.appendChild(e);else parent.insertBefore(e,parent.firstChild);}this.checkpoint();}
  selectParent(){const parent=this.selected[0]?.parentElement;if(parent&&parent!==(this.root as unknown as Element)&&parent.localName==='g')this.pick(parent);}
  group(){if(this.selected.length<2)return;const parent=this.selected[0].parentNode;if(!this.selected.every(e=>e.parentNode===parent))throw new Error('Select components in the same group first.');const ordered=Array.from(parent!.childNodes).filter(e=>this.selected.includes(e as SVGGraphicsElement));const group=this.doc.createElementNS(NS,'g');parent!.insertBefore(group,ordered[0]);ordered.forEach(e=>group.appendChild(e));this.selected=[group];this.checkpoint();}
  ungroup(){
    if(this.selected.length!==1||this.selected[0].localName!=='g')return;
    const group=this.selected[0],style=this.doc.defaultView!.getComputedStyle(group);
    if(Number(style.opacity)!==1||style.filter!=='none'||style.clipPath!=='none'||style.maskImage!=='none')throw new Error('This group has shared visual effects. Select its individual components without ungrouping.');
    const children=Array.from(group.children) as SVGGraphicsElement[];
    const inherited=['fill','fill-opacity','fill-rule','stroke','stroke-width','stroke-opacity','stroke-linecap','stroke-linejoin','stroke-dasharray','font-family','font-size','font-weight','text-anchor','visibility'];
    const styles=children.map(child=>{const computed=this.doc.defaultView!.getComputedStyle(child);return inherited.map(property=>[property,computed.getPropertyValue(property)]);});
    children.forEach((child,i)=>{styles[i].forEach(([property,value])=>child.style.setProperty(property,value));child.setAttribute('transform',`${group.getAttribute('transform')??''} ${child.getAttribute('transform')??''}`.trim());group.before(child);});
    group.remove();this.selected=children;this.nodes=false;this.node=null;this.checkpoint();
  }
  add(kind:'rect'|'ellipse'|'text'){
    const vb=this.root.viewBox.baseVal,w=vb.width*.2,h=vb.height*.2,x=vb.x+vb.width*.4,y=vb.y+vb.height*.4;
    const element=this.doc.createElementNS(NS,kind);const attrs=kind==='ellipse'?{cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2}:kind==='rect'?{x,y,width:w,height:h}:{x,y:y+h/2,'font-size':Math.min(w,h)/3};
    Object.entries(attrs).forEach(([k,v])=>element.setAttribute(k,String(v)));element.setAttribute('fill','#087f79');if(kind==='text')element.textContent='Text';this.root.appendChild(element);this.pick(element);this.checkpoint();
  }
  rename(name:string){if(this.selected.length!==1)return;const trimmed=name.trim().slice(0,120);if(trimmed)this.selected[0].setAttribute('aria-label',trimmed);else this.selected[0].removeAttribute('aria-label');this.checkpoint();}
  setText(text:string){if(this.selected.length===1&&this.selected[0].localName==='text'){this.selected[0].textContent=text;this.checkpoint();}}
  addSvg(source:string){const parsed=new DOMParser().parseFromString(sanitizeSvg(source),'image/svg+xml'),element=this.doc.importNode(parsed.documentElement,true) as unknown as SVGSVGElement,vb=this.root.viewBox.baseVal;
    // Isolate IDs so inserted templates cannot redirect existing gradients/use references.
    const prefix=`insert-${Date.now()}-`;
    const ids=new Map([element,...Array.from(element.querySelectorAll('[id]'))].filter(e=>e.id).map(e=>[e.id,prefix+e.id]));
    [element,...Array.from(element.querySelectorAll('*'))].forEach(e=>{Array.from(e.attributes).forEach(a=>{let value=a.value;if(a.name==='id')value=ids.get(value)??value;else{for(const [id,next]of ids){if(value===`#${id}`)value=`#${next}`;value=value.replace(/url\(\s*(['"]?)#([\w:.-]+)\1\s*\)/g,(match,_quote,ref)=>ref===id?`url(#${next})`:match);}}e.setAttribute(a.name,value);});});
    if(!element.hasAttribute('viewBox'))element.setAttribute('viewBox',`0 0 ${parseFloat(element.getAttribute('width')??'300')||300} ${parseFloat(element.getAttribute('height')??'150')||150}`);
    element.setAttribute('x',String(vb.x+vb.width*.25));element.setAttribute('y',String(vb.y+vb.height*.25));element.setAttribute('width',String(vb.width*.5));element.setAttribute('height',String(vb.height*.5));this.root.appendChild(element);this.selected=[];this.checkpoint();
  }
}

export function SvgTemplateEditor({svg,fa,onApply,onClose}:{svg:string;fa:boolean;onApply:(svg:string)=>void;onClose:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null),frame=useRef<HTMLIFrameElement>(null),session=useRef<SvgEditingSession|null>(null);
  const [state,setState]=useState(empty),[error,setError]=useState('');
  const [collapsed,setCollapsed]=useState<Set<Element>>(new Set());
  const t=(en:string,persian:string)=>fa?persian:en;
  const run=(action:()=>void)=>{try{setError('');action();}catch(e){setError(e instanceof Error?e.message:String(e));}};
  const close=()=>{if(session.current?.index&& !window.confirm(t('Discard SVG edits?','تغییرات این ویرایش کنار گذاشته شوند؟')))return;onClose();};
  useEffect(()=>{dialog.current?.showModal();return()=>session.current?.dispose();},[]);
  const initialize=()=>run(()=>{const doc=frame.current?.contentDocument;if(!doc)return;session.current?.dispose();session.current=new SvgEditingSession(doc,sanitizeSvg(svg),next=>{setState(next);setCollapsed(previous=>{const expanded=new Set(previous);next.layers.filter(row=>row.selected).forEach(row=>row.parents.forEach(parent=>expanded.delete(parent)));return expanded.size===previous.size?previous:expanded;});});});
  const button=(en:string,faLabel:string,action:()=>void,disabled=false)=><button type="button" disabled={disabled} onClick={()=>run(action)}>{t(en,faLabel)}</button>;
  return <dialog ref={dialog} className="svg-editor-dialog" dir={fa?'rtl':'ltr'} onCancel={event=>{event.preventDefault();close();}} onKeyDown={event=>{event.stopPropagation();if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!(event.target instanceof HTMLInputElement)){event.preventDefault();session.current?.restore(event.shiftKey?1:-1);}}}>
    <header><div><strong>{t('Edit SVG components','ویرایش اجزای SVG')}</strong><small>{t('Select a component; Shift-click to select several. Node mode edits vertices and curve handles.','یک جزء را انتخاب کنید؛ Shift برای انتخاب چند جزء. در حالت نقاط، رأس‌ها و دستگیره‌های منحنی قابل جابه‌جایی‌اند.')}</small></div>{button('Cancel','انصراف',close)}{button('Apply changes','اعمال تغییرات',()=>{if(session.current?.index)onApply(session.current.serialize());else onClose();})}</header>
    <nav aria-label={t('Vector tools','ابزارهای وکتور')}>
      {button('Undo','واگرد',()=>session.current?.restore(-1),!state.undo)}{button('Redo','ازنو',()=>session.current?.restore(1),!state.redo)}
      {button(state.nodes?'Finish nodes':'Edit nodes',state.nodes?'پایان ویرایش نقاط':'ویرایش نقاط',()=>session.current?.enterNodes(),state.count!==1)}
      {button('Add node','افزودن نقطه',()=>session.current?.addNode(),!state.node)}
      {button('Delete node','حذف نقطه',()=>session.current?.removeNode(),!state.node)}
      {button('Delete component','حذف جزء',()=>session.current?.remove(),!state.count)}
      {button('Select group','انتخاب گروه',()=>session.current?.selectParent(),state.count!==1)}
      {button('Group','گروه‌بندی',()=>session.current?.group(),state.count<2)}
      {button('Ungroup','بازکردن گروه',()=>session.current?.ungroup(),state.count!==1)}
      {button('Bring forward','رو آوردن',()=>session.current?.reorder(true),!state.count)}{button('Send back','عقب بردن',()=>session.current?.reorder(false),!state.count)}
      {(['fill','stroke'] as const).map(property=><label key={property}>{t(property==='fill'?'Fill':'Stroke',property==='fill'?'رنگ داخل':'رنگ خط')}<input aria-label={property} type="color" disabled={!state.count} defaultValue="#087f79" onChange={e=>run(()=>session.current?.paint(property,e.target.value))}/>{button('None','بدون رنگ',()=>session.current?.paint(property,'none'),!state.count)}</label>)}
    </nav>
    {error&&<p role="alert">{error}</p>}
    <div className="svg-editor-workspace"><aside>
      <div className="svg-parts-heading"><strong>{t('Shapes & groups','شکل‌ها و گروه‌ها')}</strong><span>{state.layers.filter(row=>row.kind!=='g').length.toLocaleString(fa?'fa-IR':'en-US')}</span></div>
      <p className="svg-parts-help">{t('Click a name or a shape to select it. Shift-click selects several.','برای انتخاب، روی نام یا خود شکل کلیک کنید. با Shift چند شکل را انتخاب کنید.')}</p>
      <div className="svg-editor-layers" aria-label={t('Shapes & groups','شکل‌ها و گروه‌ها')}>
        {state.layers.filter(row=>!row.parents.some(parent=>collapsed.has(parent))).map((row,i)=>{
          const name=svgComponentName(row,fa),group=row.kind==='g';
          return <div className={`svg-part-row ${row.selected?'is-selected':''}`} key={i} style={{marginInlineStart:Math.min(row.parents.length,5)*12}}>
            {group&&row.children>0&&<button className="svg-part-disclosure" type="button" aria-expanded={!collapsed.has(row.element)} aria-label={`${t('Show/hide group','نمایش یا بستن گروه')}: ${name}`} onClick={()=>{if(!collapsed.has(row.element)&&state.layers.some(child=>child.selected&&child.parents.includes(row.element)))session.current?.pick(row.element);setCollapsed(previous=>{const next=new Set(previous);if(next.has(row.element))next.delete(row.element);else next.add(row.element);return next;});}}>{collapsed.has(row.element)?'+':'−'}</button>}
            <button type="button" className="svg-part-select" aria-pressed={row.selected} onClick={event=>session.current?.pick(row.element,event.shiftKey)}>
              <span className={`svg-part-symbol ${group?'is-group':row.kind==='text'?'is-text':row.color?'is-color':'is-mixed'}`} style={!group&&row.kind!=='text'&&row.color?{backgroundColor:row.color}:undefined} aria-hidden="true">{group?'▱':row.kind==='text'?'T':''}</span>
              <span className="svg-part-label"><b>{name}</b>{group&&<small>{row.children.toLocaleString(fa?'fa-IR':'en-US')} {t('items','جزء')}</small>}</span>
              {row.selected&&<span className="svg-part-check" aria-hidden="true">✓</span>}
            </button>
          </div>;
        })}
        {!state.layers.length&&<p className="svg-parts-help">{t('No shapes yet. Add one below.','هنوز شکلی وجود ندارد. از پایین یک شکل اضافه کنید.')}</p>}
      </div>
      {state.count===1&&<form className="svg-part-details" key={state.name} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);run(()=>session.current?.rename(String(data.get('componentName')??'')));}}>
        <label>{t('Selected item name','نام شکل انتخاب‌شده')}<input name="componentName" maxLength={120} defaultValue={state.layers.find(row=>row.selected)?.name??''} placeholder={state.layers.find(row=>row.selected)?svgComponentName(state.layers.find(row=>row.selected)!,fa):''}/></label>
        <button type="submit">{t('Rename','تغییر نام')}</button>
      </form>}
      <div className="svg-editor-add"><strong>{t('Add to drawing','افزودن به طرح')}</strong>
        {button('+ Rectangle','+ مستطیل',()=>session.current?.add('rect'))}{button('+ Ellipse','+ بیضی',()=>session.current?.add('ellipse'))}{button('+ Text','+ متن',()=>session.current?.add('text'))}
        <label className="svg-file-picker">{t('+ Import SVG file','+ افزودن فایل SVG')}<input type="file" accept=".svg,image/svg+xml" onChange={async e=>{const input=e.currentTarget,file=input.files?.[0];if(file){try{const text=await file.text();run(()=>session.current?.addSvg(text));}catch{setError(t('Cannot read file','خواندن فایل ممکن نشد'));}}input.value='';}}/></label>
        {state.count===1&&session.current?.selected[0]?.localName==='text'&&<label>{t('Text content','محتوای متن')}<input aria-label="Component text" key={state.name} defaultValue={session.current.selected[0].textContent??''} onBlur={e=>run(()=>session.current?.setText(e.target.value))}/></label>}
      </div></aside>
    <iframe ref={frame} title={t('SVG editing canvas','بوم ویرایش SVG')} sandbox="allow-same-origin" onLoad={initialize} srcDoc={'<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:white}body>svg:not(.node-overlay){position:absolute;left:24px;top:24px;width:calc(100% - 48px);height:calc(100% - 48px);display:block;touch-action:none}.node-overlay{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}</style></head><body></body></html>'}/></div>
    <footer>{t('Edits affect this project only. Embedded photos remain images. Select a node and press Delete to remove it (closed shapes keep at least three vertices).','تغییرات فقط برای همین پروژه است. عکس‌های داخل فایل، عکس باقی می‌مانند. برای حذف رأس، نقطه را انتخاب کنید و Delete بزنید؛ شکل بسته حداقل سه رأس دارد.')}</footer>
  </dialog>;
}
