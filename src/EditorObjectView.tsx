import { PointerEvent as ReactPointerEvent } from 'react';
import { BioPlotObject } from './model';
import { plotToSvg } from './plots';

const dash = (style?: 'solid'|'dashed'|'dotted') => style === 'dashed' ? '9 6' : style === 'dotted' ? '2 6' : undefined;

function connectorPath(object: Extract<BioPlotObject,{type:'connector'}>) {
  const mid = object.height / 2;
  if (object.route === 'elbow') return `M4 ${mid} H${object.width/2} V${Math.max(8,object.height-8)} H${object.width-9}`;
  if (object.route === 'curved') return `M4 ${mid} C${object.width*.3} 3 ${object.width*.7} ${object.height-3} ${object.width-9} ${mid}`;
  return `M4 ${mid} H${object.width-9}`;
}

function Markers({ object, inhibition = false }:{object:Extract<BioPlotObject,{type:'arrow'|'connector'}>;inhibition?:boolean}) {
  return <defs>
    <marker id={`end-${object.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill={object.stroke}/></marker>
    <marker id={`start-${object.id}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse"><path d="M8 0L0 4L8 8Z" fill={object.stroke}/></marker>
    {inhibition && <marker id={`inhibit-${object.id}`} markerWidth="8" markerHeight="12" refX="7" refY="6" orient="auto"><path d="M7 1V11" stroke={object.stroke} strokeWidth="2"/></marker>}
  </defs>;
}

export function EditorObjectView({ object, selected, onPointerDown, onContextMenu }:{
  object:BioPlotObject;
  selected:boolean;
  onPointerDown:(event:ReactPointerEvent<HTMLDivElement>,object:BioPlotObject)=>void;
  onContextMenu:(event:ReactPointerEvent<HTMLDivElement>,object:BioPlotObject)=>void;
}) {
  if (object.hidden) return null;
  const style = { left:object.x, top:object.y, width:object.width, height:object.height, opacity:object.opacity, transform:`rotate(${object.rotation}deg)` };
  const common = {
    style,
    className:`studio-object ${selected?'is-selected':''} ${object.locked?'is-locked':''}`,
    onPointerDown:(event:ReactPointerEvent<HTMLDivElement>)=>onPointerDown(event,object),
    onContextMenu:(event:ReactPointerEvent<HTMLDivElement>)=>onContextMenu(event,object)
  };

  if (object.type === 'text') return <div {...common} className={`${common.className} studio-text`} style={{...style,color:object.color,fontSize:object.fontSize,fontWeight:object.fontWeight,fontStyle:object.fontStyle??'normal',textAlign:object.align,justifyContent:object.align==='left'?'flex-start':object.align==='right'?'flex-end':'center'}}>{object.text}</div>;
  if (object.type === 'label') return <div {...common} className={`${common.className} studio-label label-${object.variant}`} style={{...style,color:object.color,background:object.background,borderColor:object.borderColor,fontSize:object.fontSize,fontWeight:object.fontWeight,textAlign:object.align}}>{object.text}</div>;
  if (object.type === 'shape') return <div {...common} style={{...style,background:object.fill,border:`${object.strokeWidth}px ${object.lineStyle==='dashed'?'dashed':object.lineStyle==='dotted'?'dotted':'solid'} ${object.stroke}`,borderRadius:object.shape==='ellipse'?'50%':object.radius}}/>;
  if (object.type === 'container') return <div {...common} className={`${common.className} studio-container`} style={{...style,background:object.fill,border:`${object.strokeWidth}px solid ${object.stroke}`,borderRadius:object.radius}}/>;
  if (object.type === 'asset') return <div {...common} className={`${common.className} studio-asset`} dangerouslySetInnerHTML={{__html:object.svg}}/>;
  if (object.type === 'image') return <div {...common} className={`${common.className} studio-image`}><img src={object.src} alt={object.alt??object.name} style={{objectFit:object.fit}}/></div>;
  if (object.type === 'plot') return <div {...common} className={`${common.className} studio-plot`}><svg width="100%" height="100%" viewBox={`0 0 ${object.width} ${object.height}`} dangerouslySetInnerHTML={{__html:plotToSvg(object.spec,object.width,object.height)}}/></div>;
  if (object.type === 'arrow') return <div {...common}><svg width="100%" height="100%" viewBox={`0 0 ${object.width} ${object.height}`}><Markers object={object}/><line x1="4" y1={object.height/2} x2={object.width-9} y2={object.height/2} stroke={object.stroke} strokeWidth={object.strokeWidth} strokeDasharray={dash(object.lineStyle)} markerStart={object.arrowHead==='both'?`url(#start-${object.id})`:undefined} markerEnd={object.arrowHead==='none'?undefined:`url(#end-${object.id})`}/></svg></div>;
  return <div {...common}><svg width="100%" height="100%" viewBox={`0 0 ${object.width} ${object.height}`}><Markers object={object} inhibition/><path d={connectorPath(object)} fill="none" stroke={object.stroke} strokeWidth={object.strokeWidth} strokeDasharray={dash(object.lineStyle)} markerStart={object.arrowHead==='both'?`url(#start-${object.id})`:undefined} markerEnd={object.arrowHead==='none'?undefined:object.arrowHead==='inhibition'?`url(#inhibit-${object.id})`:`url(#end-${object.id})`}/>{object.label&&<text x={object.width/2} y={Math.max(12,object.height/2-8)} textAnchor="middle" fontSize="11" fill="#526e7a">{object.label}</text>}</svg></div>;
}
