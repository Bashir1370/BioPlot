import type {BioPlotDocument} from '../model';
import {documentToSvg} from '../export';
const key='bioplot-design-source';
export function startOrderFromFigure(document:BioPlotDocument){
 // Stage a snapshot in this tab only. Nothing is uploaded before submission.
 sessionStorage.setItem(key,JSON.stringify({title:document.title,projectId:document.id,svg:documentToSvg(document)}));
 window.location.href='/orders?new=1';
}
export function readOrderSource():{title:string;projectId:string;svg:string}|null{
 try{const value=JSON.parse(sessionStorage.getItem(key)||'null');return value&&typeof value.title==='string'&&typeof value.projectId==='string'&&typeof value.svg==='string'?value:null;}catch{return null;}
}
export function clearOrderSource(){sessionStorage.removeItem(key);}
