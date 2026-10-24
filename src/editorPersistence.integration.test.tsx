// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createBlankDocument} from './model';
const mocks=vi.hoisted(()=>({load:vi.fn(),save:vi.fn(),publish:vi.fn(),receive:null as null|((event:unknown)=>void)}));
vi.mock('./persistence',()=>({projects:{loadForEditor:mocks.load,save:mocks.save}}));
vi.mock('./cloudAssetLibrary',async importOriginal=>({...await importOriginal<typeof import('./cloudAssetLibrary')>(),reloadRuntimeCloudAssetsFromBrowserCache:()=>[]}));
vi.mock('./collaboration',()=>({createAnonymousPresence:()=>({id:'test',name:'Test',color:'#000'}),createCollaborationSession:()=>({connect:async()=>{},subscribe:(receive:(event:unknown)=>void)=>{mocks.receive=receive;return()=>{mocks.receive=null;};},disconnect:()=>{},publishDocument:mocks.publish})}));
import {EditorStudio} from './EditorStudio';
let host:HTMLDivElement,root:Root;
let currentDocument:ReturnType<typeof createBlankDocument>;
beforeEach(()=>{
 vi.useFakeTimers();vi.clearAllMocks();mocks.save.mockResolvedValue(undefined);
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
 localStorage.clear();sessionStorage.clear();currentDocument=createBlankDocument();mocks.load.mockResolvedValue({document:currentDocument});history.replaceState(null,'',`/editor?id=${currentDocument.id}`);
 host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.useRealTimers();vi.unstubAllGlobals();});
async function mount(){await act(async()=>root.render(<EditorStudio/>));}
async function rename(value:string){
 const input=host.querySelector<HTMLInputElement>('input[aria-label="Project name"]')!;
 await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});
}
const exit=()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;};
describe('editor persistence lifecycle',()=>{
 it('warns before leaving unsaved edits and clears the warning after a successful save',async()=>{
  await mount();expect(exit()).toBe(false);
  await rename('My figure');expect(exit()).toBe(true);
  await act(async()=>{await vi.advanceTimersByTimeAsync(500);});
  expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({title:'My figure'}));
  expect(exit()).toBe(false);expect(location.search).toContain('id=');
 });
 it('does not overwrite a pending local edit with a remote document',async()=>{
  await mount();await rename('Local work');
  const id=(host.querySelector('input[aria-label="Project name"]') as HTMLInputElement).value;
  const remote={...currentDocument,title:'Remote version'};
  await act(async()=>mocks.receive?.({type:'document',document:remote,senderId:'other'}));
  expect((host.querySelector('input[aria-label="Project name"]') as HTMLInputElement).value).toBe(id);
  await act(async()=>{await vi.advanceTimersByTimeAsync(500);});
  expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({title:'Local work'}));
 });
});
