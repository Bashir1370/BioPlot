import type {BioPlotDocument} from './model';

const prefix='bioplot_unsaved_figure:';

// Navigation drafts live only in this tab, outside the dashboard repositories.
export function openFigureDraft(document:BioPlotDocument){
 sessionStorage.setItem(`${prefix}${document.id}`,JSON.stringify(document));
 window.location.href=`/editor?draft=${encodeURIComponent(document.id)}`;
}
export function readFigureDraft(id:string):BioPlotDocument|null{
 const value=sessionStorage.getItem(`${prefix}${id}`);
 return value?JSON.parse(value):null;
}
export function clearFigureDraft(id:string){
 try{sessionStorage.removeItem(`${prefix}${id}`);}catch{/* Saving must not depend on session storage. */}
}
// Navigation, language and export preferences are not edits to a figure.
export function figureContent(document:BioPlotDocument){
 return JSON.stringify({title:document.title,pages:document.pages,tags:document.metadata.tags,journalPreset:document.metadata.journalPreset});
}
