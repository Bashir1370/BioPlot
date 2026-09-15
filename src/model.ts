export const DOCUMENT_SCHEMA_VERSION = 5 as const;

export type ObjectId = string;
export type BioPlotObjectType = 'text'|'label'|'shape'|'arrow'|'connector'|'asset'|'image'|'plot'|'container';
export type LineStyle = 'solid'|'dashed'|'dotted';
export type ConnectorPort = 'auto'|'top'|'right'|'bottom'|'left'|'center';

export interface Transform { x:number; y:number; width:number; height:number; rotation:number; opacity:number; }
export interface BaseObject extends Transform { id:ObjectId; type:BioPlotObjectType; name:string; groupId?:string; parentId?:string; locked?:boolean; hidden?:boolean; }
export interface TextObject extends BaseObject { type:'text'; text:string; color:string; fontSize:number; fontWeight:number; fontStyle?:'normal'|'italic'; fontFamily?:string; lineHeight?:number; letterSpacing?:number; textDecoration?:'none'|'underline'; align:'left'|'center'|'right'; verticalAlign?:'top'|'middle'|'bottom'; }
export interface LabelObject extends BaseObject { type:'label'; text:string; variant:'panel'|'tag'|'note'; color:string; background:string; borderColor:string; fontSize:number; fontWeight:number; fontFamily?:string; align:'left'|'center'|'right'; }
export interface ShapeObject extends BaseObject { type:'shape'; shape:'rect'|'ellipse'; fill:string; stroke:string; strokeWidth:number; lineStyle?:LineStyle; radius:number; }
export interface ArrowObject extends BaseObject { type:'arrow'; stroke:string; strokeWidth:number; lineStyle?:LineStyle; arrowHead:'end'|'both'|'none'; }
export interface ConnectorObject extends BaseObject { type:'connector'; stroke:string; strokeWidth:number; lineStyle:LineStyle; route:'straight'|'elbow'|'curved'; arrowHead:'end'|'both'|'none'|'inhibition'; fromObjectId?:string; toObjectId?:string; fromPort?:ConnectorPort; toPort?:ConnectorPort; autoRoute?:boolean; label?:string; }
export interface AssetColorSlot { key:string; label:string; value:string; }
export interface AssetObject extends BaseObject { type:'asset'; assetId:string; svg:string; colors:AssetColorSlot[]; }
export interface ImageObject extends BaseObject { type:'image'; src:string; alt?:string; fit:'contain'|'cover'; naturalWidth?:number; naturalHeight?:number; }
export interface ContainerObject extends BaseObject { type:'container'; fill:string; stroke:string; strokeWidth:number; radius:number; padding:number; }
export type PlotKind='bar'|'scatter';
export interface PlotSeries { id:string; name:string; color:string; values:Array<{x:number;y:number;label?:string}>; }
export interface PlotSpec { kind:PlotKind; title:string; xLabel:string; yLabel:string; series:PlotSeries[]; showLegend:boolean; showGrid:boolean; }
export interface PlotObject extends BaseObject { type:'plot'; spec:PlotSpec; }
export type BioPlotObject = TextObject|LabelObject|ShapeObject|ArrowObject|ConnectorObject|AssetObject|ImageObject|PlotObject|ContainerObject;
export interface BioPlotPage { id:string; name:string; width:number; height:number; background:string; objects:BioPlotObject[]; }
export interface BioPlotDocument { schemaVersion:typeof DOCUMENT_SCHEMA_VERSION; id:string; title:string; createdAt:string; updatedAt:string; ownerId?:string; activePageId:string; pages:BioPlotPage[]; metadata:{locale:'en'|'fa'; journalPreset?:string; tags:string[]; lastExportDpi?:number; lastExportWidthMm?:number;} }

export const makeId=(prefix='obj')=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
export const defaultPlotSpec=():PlotSpec=>({kind:'bar',title:'Experimental result',xLabel:'Condition',yLabel:'Value',showLegend:false,showGrid:true,series:[{id:makeId('series'),name:'Series 1',color:'#0b7a75',values:[{x:0,y:35,label:'Control'},{x:1,y:68,label:'Treatment'},{x:2,y:51,label:'Recovery'}]}]});
export function createBlankDocument(title='Untitled scientific figure'):BioPlotDocument { const now=new Date().toISOString(); const pageId=makeId('page'); return {schemaVersion:DOCUMENT_SCHEMA_VERSION,id:makeId('doc'),title,createdAt:now,updatedAt:now,activePageId:pageId,pages:[{id:pageId,name:'Figure 1',width:960,height:620,background:'#ffffff',objects:[]}],metadata:{locale:'en',tags:[],lastExportDpi:300,lastExportWidthMm:160}}; }
export function cloneDocument(document:BioPlotDocument):BioPlotDocument{return structuredClone(document);}
export function activePage(document:BioPlotDocument):BioPlotPage{return document.pages.find(page=>page.id===document.activePageId)??document.pages[0];}
export function migrateDocument(input:unknown):BioPlotDocument { if(!input||typeof input!=='object') return createBlankDocument(); const candidate=input as Record<string,unknown>; if(candidate.schemaVersion===DOCUMENT_SCHEMA_VERSION) return candidate as unknown as BioPlotDocument; return createBlankDocument(typeof candidate.title==='string'?candidate.title:undefined); }
