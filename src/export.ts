import { activePage, AssetObject, BioPlotDocument, BioPlotObject, ContainerObject, ImageObject, LabelObject, PlotObject, ShapeObject, TextObject } from './model';
import { connectorPath } from './connectors';
import { plotToSvg } from './plots';

export interface SvgExportOptions {
  transparent?: boolean;
  objectIds?: Set<string>;
  cropToSelection?: boolean;
}

export const EXPORT_DPI_PRESETS=[150,300,600] as const;
export const JOURNAL_WIDTH_PRESETS=[
  {id:'single',label:'Single column',widthMm:85},
  {id:'one-half',label:'1.5 column',widthMm:120},
  {id:'double',label:'Double column',widthMm:180},
  {id:'a4',label:'A4 content width',widthMm:190}
] as const;

const esc = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] ?? char));
const dash = (style?: 'solid' | 'dashed' | 'dotted') => style === 'dashed' ? ' stroke-dasharray="9 6"' : style === 'dotted' ? ' stroke-dasharray="2 6" stroke-linecap="round"' : '';

function transform(object: BioPlotObject) { return `translate(${object.x} ${object.y}) rotate(${object.rotation} ${object.width / 2} ${object.height / 2})`; }
function stripOuterSvg(svg: string) { return svg.replace(/^\s*<\?xml[^>]*>\s*/i, '').replace(/^\s*<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, ''); }
function viewBox(svg: string, fallbackWidth: number, fallbackHeight: number) { const match = svg.match(/viewBox=["']([^"']+)["']/i); return match?.[1] ?? `0 0 ${fallbackWidth} ${fallbackHeight}`; }

function textAnchor(align:'left'|'center'|'right'){return align==='left'?'start':align==='right'?'end':'middle';}
function renderText(object: TextObject) {
  const anchor=textAnchor(object.align),x=object.align==='left'?0:object.align==='right'?object.width:object.width/2;
  const lineHeight=object.fontSize*(object.lineHeight??1.2),lines=object.text.split(/\r?\n/),total=lineHeight*lines.length;
  const startY=object.verticalAlign==='top'?object.fontSize:object.verticalAlign==='bottom'?object.height-total+object.fontSize:object.height/2-total/2+object.fontSize*.75;
  const tspans=lines.map((line,index)=>`<tspan x="${x}" dy="${index===0?0:lineHeight}">${esc(line)}</tspan>`).join('');
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><text x="${x}" y="${startY}" text-anchor="${anchor}" font-family="${esc(object.fontFamily||'Inter')},Vazirmatn,Arial,sans-serif" font-size="${object.fontSize}" font-weight="${object.fontWeight}" font-style="${object.fontStyle ?? 'normal'}" text-decoration="${object.textDecoration??'none'}" letter-spacing="${object.letterSpacing??0}" fill="${object.color}">${tspans}</text></g>`;
}
function renderLabel(object: LabelObject) {
  const anchor=textAnchor(object.align),x=object.align==='left'?9:object.align==='right'?object.width-9:object.width/2,y=object.height/2+object.fontSize*.34,radius=object.variant==='panel'?9:8;
  return `<g transform="${transform(object)}" opacity="${object.opacity}"><rect width="${object.width}" height="${object.height}" rx="${radius}" fill="${object.background}" stroke="${object.borderColor}"/><text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${esc(object.fontFamily||'Inter')},Vazirmatn,Arial,sans-serif" font-size="${object.fontSize}" font-weight="${object.fontWeight}" fill="${object.color}">${esc(object.text)}</text></g>`;
}
function renderShape(object: ShapeObject) { const common=`fill="${object.fill}" stroke="${object.stroke}" stroke-width="${object.strokeWidth}"${dash(object.lineStyle)}`;const shape=object.shape==='ellipse'?`<ellipse cx="${object.width/2}" cy="${object.height/2}" rx="${object.width/2}" ry="${object.height/2}" ${common}/>`:`<rect width="${object.width}" height="${object.height}" rx="${object.radius}" ${common}/>`;return `<g transform="${transform(object)}" opacity="${object.opacity}">${shape}</g>`; }
function markerAttrs(head:'end'|'both'|'none'|'inhibition'){if(head==='none')return'';if(head==='inhibition')return' marker-end="url(#bp-inhibit-end)"';return `${head==='both'?' marker-start="url(#bp-arrow-start)"':''} marker-end="url(#bp-arrow-end)"`;}
function renderArrow(object:Extract<BioPlotObject,{type:'arrow'}>){return `<g transform="${transform(object)}" opacity="${object.opacity}"><line x1="4" y1="${object.height/2}" x2="${object.width-8}" y2="${object.height/2}" stroke="${object.stroke}" stroke-width="${object.strokeWidth}"${dash(object.lineStyle)}${markerAttrs(object.arrowHead)}/></g>`;}
function renderConnector(object:Extract<BioPlotObject,{type:'connector'}>){const label=object.label?`<text x="${object.width/2}" y="${Math.max(12,object.height/2-8)}" text-anchor="middle" font-family="Inter,Vazirmatn,Arial,sans-serif" font-size="11" fill="#526e7a">${esc(object.label)}</text>`:'';return `<g transform="${transform(object)}" opacity="${object.opacity}"><path d="${connectorPath(object)}" fill="none" stroke="${object.stroke}" stroke-width="${object.strokeWidth}"${dash(object.lineStyle)}${markerAttrs(object.arrowHead)}/>${label}</g>`;}
function renderAsset(object:AssetObject){const vb=viewBox(object.svg,object.width,object.height);return `<g transform="${transform(object)}" opacity="${object.opacity}"><svg width="${object.width}" height="${object.height}" viewBox="${esc(vb)}" preserveAspectRatio="xMidYMid meet">${stripOuterSvg(object.svg)}</svg></g>`;}
function renderImage(object:ImageObject){const preserve=object.fit==='cover'?'xMidYMid slice':'xMidYMid meet';return `<g transform="${transform(object)}" opacity="${object.opacity}"><image href="${esc(object.src)}" width="${object.width}" height="${object.height}" preserveAspectRatio="${preserve}"/></g>`;}
function renderContainer(object:ContainerObject){return `<g transform="${transform(object)}" opacity="${object.opacity}"><rect width="${object.width}" height="${object.height}" rx="${object.radius}" fill="${object.fill}" stroke="${object.stroke}" stroke-width="${object.strokeWidth}"/></g>`;}
function renderPlot(object:PlotObject){return `<g transform="${transform(object)}" opacity="${object.opacity}">${plotToSvg(object.spec,object.width,object.height)}</g>`;}

export function objectToSvg(object:BioPlotObject){if(object.hidden)return'';switch(object.type){case'text':return renderText(object);case'label':return renderLabel(object);case'shape':return renderShape(object);case'arrow':return renderArrow(object);case'connector':return renderConnector(object);case'asset':return renderAsset(object);case'image':return renderImage(object);case'container':return renderContainer(object);case'plot':return renderPlot(object);}}

function selectionBounds(objects:BioPlotObject[]){if(!objects.length)return null;const x=Math.min(...objects.map(o=>o.x)),y=Math.min(...objects.map(o=>o.y)),right=Math.max(...objects.map(o=>o.x+o.width)),bottom=Math.max(...objects.map(o=>o.y+o.height));return{x,y,width:right-x,height:bottom-y};}

export function documentToSvg(bioDocument:BioPlotDocument,options:SvgExportOptions={}){
  const page=activePage(bioDocument),visible=page.objects.filter(object=>!object.hidden&&(!options.objectIds||options.objectIds.has(object.id))),crop=options.cropToSelection?selectionBounds(visible):null;
  const width=crop?.width??page.width,height=crop?.height??page.height,offsetX=crop?.x??0,offsetY=crop?.y??0;
  const objects=visible.map(object=>objectToSvg({...object,x:object.x-offsetX,y:object.y-offsetY} as BioPlotObject)).join('');
  const background=options.transparent?'':`<rect width="100%" height="100%" fill="${page.background}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><marker id="bp-arrow-end" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="context-stroke"/></marker><marker id="bp-arrow-start" markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse"><path d="M8 0L0 4L8 8Z" fill="context-stroke"/></marker><marker id="bp-inhibit-end" markerWidth="8" markerHeight="12" refX="7" refY="6" orient="auto"><path d="M7 1V11" stroke="context-stroke" stroke-width="2"/></marker></defs>${background}${objects}</svg>`;
}

const safeFileName=(title:string)=>title.trim().replace(/[^a-z0-9-_]+/gi,'-').replace(/^-|-$/g,'')||'bioplot-figure';
export function downloadSvg(bioDocument:BioPlotDocument,options:SvgExportOptions={}){downloadBlob(new Blob([documentToSvg(bioDocument,options)],{type:'image/svg+xml;charset=utf-8'}),`${safeFileName(bioDocument.title)}${options.objectIds?'-selection':''}.svg`);}

export async function downloadPng(bioDocument:BioPlotDocument,dpi=300,widthMm=160,options:SvgExportOptions={}){
  const page=activePage(bioDocument),svg=documentToSvg(bioDocument,options),crop=options.cropToSelection?selectionBounds(page.objects.filter(o=>!o.hidden&&(!options.objectIds||options.objectIds.has(o.id)))):null,sourceWidth=crop?.width??page.width,sourceHeight=crop?.height??page.height;
  const targetWidth=Math.max(1,Math.round((widthMm/25.4)*dpi)),scale=targetWidth/sourceWidth,targetHeight=Math.max(1,Math.round(sourceHeight*scale)),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  try{const image=await loadImage(url),canvas=window.document.createElement('canvas');canvas.width=targetWidth;canvas.height=targetHeight;const context=canvas.getContext('2d');if(!context)throw new Error('Canvas is not available.');context.drawImage(image,0,0,targetWidth,targetHeight);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('PNG export failed.')),'image/png'));downloadBlob(blob,`${safeFileName(bioDocument.title)}${options.objectIds?'-selection':''}-${dpi}dpi.png`);}finally{URL.revokeObjectURL(url);}
}

function loadImage(url:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Could not render SVG for PNG export.'));image.src=url;});}
function downloadBlob(blob:Blob,name:string){const anchor=window.document.createElement('a'),url=URL.createObjectURL(blob);anchor.href=url;anchor.download=name;window.document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
