import {describe,it,expect} from 'vitest';
import {BioPlotStore,AddObjectsCommand,PageObjectsCommand} from './engine';
import {AddStudioPageCommand,CanvasSettingsCommand} from './studioPages';
import {activePage,cloneDocument,createBlankDocument,type BioPlotObject} from './model';

function setup(){
  const document=createBlankDocument();activePage(document).objects=[];
  const first=document.activePageId;
  const store=new BioPlotStore(document);
  store.dispatch(new AddStudioPageCommand({id:'second',name:'Second',width:960,height:620,background:'#ffffff',objects:[]},first));
  const navigate=()=>{const next=cloneDocument(store.snapshot);next.activePageId=first;store.replace(next);};
  return {store,first,navigate};
}
const object:BioPlotObject={id:'shape',type:'shape',shape:'rect',name:'Cell',x:10,y:20,width:60,height:50,rotation:0,opacity:1,fill:'#fff',stroke:'#000',strokeWidth:1,radius:0};
describe('multi-page editing',()=>{
  it('adds a page and restores the correct active page on undo and redo',()=>{
    const {store,first}=setup();expect(store.snapshot.pages).toHaveLength(2);
    store.undo();expect(store.snapshot.pages).toHaveLength(1);expect(store.snapshot.activePageId).toBe(first);
    store.redo();expect(store.snapshot.pages).toHaveLength(2);expect(store.snapshot.activePageId).toBe('second');
  });
  it('undoes object additions and drag edits on their original page after navigation',()=>{
    const {store,navigate}=setup();store.dispatch(new AddObjectsCommand('Add',[object]));navigate();store.undo();
    expect(store.snapshot.activePageId).toBe('second');expect(activePage(store.snapshot).objects).toHaveLength(0);
    store.redo();store.commitObjectState([object],[{...object,x:220}],'Drag');navigate();store.undo();
    expect(activePage(store.snapshot).objects[0].x).toBe(10);expect(store.snapshot.pages[0].objects).toHaveLength(0);
  });
  it('does not overwrite a different page when undoing layer reordering',()=>{
    const {store,navigate}=setup();store.dispatch(new AddObjectsCommand('Add',[object]));
    store.dispatch(new PageObjectsCommand('Layers',[object],[{...object,id:'other'},object]));navigate();store.undo();
    expect(activePage(store.snapshot).objects).toEqual([object]);expect(store.snapshot.pages[0].objects).toHaveLength(0);
  });
  it('undoes and redoes canvas size and color',()=>{
    const {store,navigate}=setup();store.dispatch(new CanvasSettingsCommand({width:960,height:620,background:'#ffffff'},{width:1200,height:700,background:'#abcdef'}));
    navigate();store.undo();expect(activePage(store.snapshot).width).toBe(960);expect(activePage(store.snapshot).background).toBe('#ffffff');
    store.redo();expect(activePage(store.snapshot).width).toBe(1200);expect(activePage(store.snapshot).background).toBe('#abcdef');
  });
});
