// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {CardContainer,CardBody,CardItem} from './components/ui/3d-card';
let root:Root|undefined;
let host:HTMLDivElement|undefined;
afterEach(()=>{if(root)act(()=>root!.unmount());host?.remove();vi.unstubAllGlobals();});
function mount(hover:boolean,reduced:boolean){
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 vi.stubGlobal('matchMedia',(query:string)=>({matches:query.includes('prefers-reduced-motion')?reduced:hover,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
 host=document.createElement('div');document.body.append(host);root=createRoot(host);
 act(()=>root!.render(<CardContainer className="test-stage"><CardBody><CardItem translateZ={70} className="test-item">Figure</CardItem></CardBody></CardContainer>));
 return {stage:host.querySelector<HTMLElement>('.test-stage')!,item:host.querySelector<HTMLElement>('.test-item')!};
}
function hoverCard(stage:HTMLElement){
 vi.spyOn(stage,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:300,height:400,right:300,bottom:400,x:0,y:0,toJSON:()=>({})});
 act(()=>{stage.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));stage.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:290,clientY:390}));});
}
describe('3D service card interaction',()=>{
 it('lifts layers on hover and resets when leaving',()=>{
  const {stage,item}=mount(true,false);hoverCard(stage);
  expect(stage.style.transform).toContain('rotateY(');expect(item.style.transform).toContain('translateZ(70px)');
  act(()=>stage.dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body})));
  expect(stage.style.transform).toBe('rotateY(0deg) rotateX(0deg)');expect(item.style.transform).toContain('translateZ(0px)');
 });
 it.each([[false,false],[true,true]])('keeps touch/reduced-motion cards flat (%s, %s)',(hover,reduced)=>{
  const {stage,item}=mount(hover,reduced);hoverCard(stage);
  expect(stage.style.transform).not.toContain('rotateY(');expect(item.style.transform).toContain('translateZ(0px)');
 });
});
