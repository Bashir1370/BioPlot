import { PointerEvent as ReactPointerEvent } from 'react';
import { connectorPath, resolveConnector } from './connectors';
import { BioPlotObject } from './model';
import { plotToSvg } from './plots';
import { fontStackForText } from './typography';

const dash = (style?: 'solid'|'dashed'|'dotted') => style === 'dashed' ? '9 6' : style === 'dotted' ? '2 6' : undefined;

function Markers({ object, inhibition = false }:{object:Extract<BioPlotObject,{type:'arrow'|'connector'}>;inhibition?:boolean}) {
  return <defs>
    <marker id={`end-${object.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill={object.stroke}/></marker>
    <marker id={`start-${object.id}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse"><path d="M8 0L0 4L8 8Z" fill={object.stroke}/></marker>
    {inhibition && <marker id={`inhibit-${object.id}`} markerWidth="8" markerHeight="12" refX="7" refY="6" orient="auto"><path d="M7 1V11" stroke={object.stroke} strokeWidth="2"/></marker>}
  </defs>;
}

export function EditorObjectView({ object, objects, selected, onPointerDown, onContextMenu }:{
  object:BioPlotObject;
  objects?:BioPlotObject[];
  selected:boolean;
  onPointerDown:(event:ReactPointerEvent<HTMLDivElement>,object:BioPlotObject)=>void;
  onContextMenu:(event:ReactPointerEvent<HTMLDivElement>,object:BioPlotObject)=>void;
}) {
  if (object.hidden) return null;
  const rendered=object.type==='connector'&&objects?resolveConnector(object,objects):object;
  const style = { left:rendered.x, top:rendered.y, width:rendered.width, height:rendered.height, opacity:rendered.opacity, transform:`rotate(${rendered.rotation}deg)` };
  const common = {
    style,
    className:`studio-object ${selected?'is-selected':''} ${object.locked?'is-locked':''}`,
    onPointerDown:(event:ReactPointerEvent<HTMLDivElement>)=>onPointerDown(event,object),
    onContextMenu:(event:ReactPointerEvent<HTMLDivElement>)=>onContextMenu(event,object)
  };

  if (rendered.type === 'text') return <div {...common} className={`${common.className} studio-text`} style={{...style,color:rendered.color,fontSize:rendered.fontSize,fontWeight:rendered.fontWeight,fontStyle:rendered.fontStyle??'normal',fontFamily:fontStackForText(rendered.text,rendered.fontFamily),lineHeight:rendered.lineHeight??1.2,letterSpacing:rendered.letterSpacing??0,textDecoration:rendered.textDecoration??'none',textAlign:rendered.align,justifyContent:rendered.align==='left'?'flex-start':rendered.align==='right'?'flex-end':'center',alignItems:rendered.verticalAlign==='top'?'flex-start':rendered.verticalAlign==='bottom'?'flex-end':'center',whiteSpace:'pre-wrap'}}>{rendered.text}</div>;
  if (rendered.type === 'label') return <div {...common} className={`${common.className} studio-label label-${rendered.variant}`} style={{...style,color:rendered.color,background:rendered.background,borderColor:rendered.borderColor,fontSize:rendered.fontSize,fontWeight:rendered.fontWeight,fontFamily:fontStackForText(rendered.text,rendered.fontFamily),textAlign:rendered.align}}>{rendered.text}</div>;
  if (rendered.type === 'shape') return <div {...common} style={{...style,background:rendered.fill,border:`${rendered.strokeWidth}px ${rendered.lineStyle==='dashed'?'dashed':rendered.lineStyle==='dotted'?'dotted':'solid'} ${rendered.stroke}`,borderRadius:rendered.shape==='ellipse'?'50%':rendered.radius}}/>;
  if (rendered.type === 'container') return <div {...common} className={`${common.className} studio-container`} style={{...style,background:rendered.fill,border:`${rendered.strokeWidth}px solid ${rendered.stroke}`,borderRadius:rendered.radius}}/>;
  if (rendered.type === 'asset') return <div {...common} className={`${common.className} studio-asset`} dangerouslySetInnerHTML={{__html:rendered.svg}}/>;
  if (rendered.type === 'image') return <div {...common} className={`${common.className} studio-image`}><img src={rendered.src} alt={rendered.alt??rendered.name} style={{objectFit:rendered.fit}}/></div>;
  if (rendered.type === 'plot') return <div {...common} className={`${common.className} studio-plot`}><svg width="100%" height="100%" viewBox={`0 0 ${rendered.width} ${rendered.height}`} dangerouslySetInnerHTML={{__html:plotToSvg(rendered.spec,rendered.width,rendered.height)}}/></div>;
  if (rendered.type === 'arrow') return <div {...common}><svg width="100%" height="100%" viewBox={`0 0 ${rendered.width} ${rendered.height}`}><Markers object={rendered}/><line x1="4" y1={rendered.height/2} x2={rendered.width-9} y2={rendered.height/2} stroke={rendered.stroke} strokeWidth={rendered.strokeWidth} strokeDasharray={dash(rendered.lineStyle)} markerStart={rendered.arrowHead==='both'?`url(#start-${rendered.id})`:undefined} markerEnd={rendered.arrowHead==='none'?undefined:`url(#end-${rendered.id})`}/></svg></div>;
  return <div {...common}><svg width="100%" height="100%" viewBox={`0 0 ${rendered.width} ${rendered.height}`}><Markers object={rendered} inhibition/><path d={connectorPath(rendered)} fill="none" stroke={rendered.stroke} strokeWidth={rendered.strokeWidth} strokeDasharray={dash(rendered.lineStyle)} markerStart={rendered.arrowHead==='both'?`url(#start-${rendered.id})`:undefined} markerEnd={rendered.arrowHead==='none'?undefined:rendered.arrowHead==='inhibition'?`url(#inhibit-${rendered.id})`:`url(#end-${rendered.id})`}/>{rendered.label&&<text x={rendered.width/2} y={Math.max(12,rendered.height/2-8)} textAnchor="middle" fontSize="11" fontFamily={fontStackForText(rendered.label)} fill="#526e7a">{rendered.label}</text>}</svg></div>;
}
