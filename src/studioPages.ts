import type { Command } from './engine';
import { activePage, cloneDocument, type BioPlotDocument, type BioPlotPage } from './model';

export class AddStudioPageCommand implements Command {
  label = 'Add page';
  constructor(private page:BioPlotPage,private previousPageId:string){}
  execute(document:BioPlotDocument){
    const next=cloneDocument(document);
    if(!next.pages.some(page=>page.id===this.page.id))next.pages.push(structuredClone(this.page));
    next.activePageId=this.page.id;
    next.updatedAt=new Date().toISOString();
    return next;
  }
  undo(document:BioPlotDocument){
    const next=cloneDocument(document);
    if(next.pages.length>1)next.pages=next.pages.filter(page=>page.id!==this.page.id);
    next.activePageId=next.pages.some(page=>page.id===this.previousPageId)?this.previousPageId:next.pages[0].id;
    next.updatedAt=new Date().toISOString();
    return next;
  }
}
export type CanvasSettings=Pick<BioPlotPage,'width'|'height'|'background'>;
export class CanvasSettingsCommand implements Command {
  label='Canvas settings';
  constructor(private before:CanvasSettings,private after:CanvasSettings){}
  private apply(document:BioPlotDocument,settings:CanvasSettings){
    const next=cloneDocument(document);
    Object.assign(activePage(next),settings);
    next.updatedAt=new Date().toISOString();
    return next;
  }
  execute(document:BioPlotDocument){return this.apply(document,this.after);}
  undo(document:BioPlotDocument){return this.apply(document,this.before);}
}
