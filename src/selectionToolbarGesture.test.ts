import {describe,it,expect,vi} from 'vitest';
import {trackSelectionToolbarGesture} from './selectionToolbarGesture';
const start={pointerId:1,clientX:100,clientY:100};
function send(root:EventTarget,type:string,x=100,y=100,pointerId=1){
  const event=new Event(type);
  Object.assign(event,{clientX:x,clientY:y,pointerId});
  root.dispatchEvent(event);
}
describe('selection toolbar gesture lifecycle',()=>{
 it('hides while dragging and stays hidden after release, even after returning to the start',()=>{
  const root=new EventTarget(),visible=vi.fn();
  trackSelectionToolbarGesture(root,start,true,visible);
  send(root,'pointermove',120);
  expect(visible.mock.calls).toEqual([[false]]);
  send(root,'pointermove',100);send(root,'pointerup');
  expect(visible.mock.calls).toEqual([[false]]);
  trackSelectionToolbarGesture(root,start,true,visible);
  send(root,'pointerup');
  expect(visible.mock.calls).toEqual([[false],[true]]);
 });
 it('accepts slight click jitter but does not reopen on blank space or handle clicks',()=>{
  const root=new EventTarget(),visible=vi.fn();
  trackSelectionToolbarGesture(root,start,true,visible);
  send(root,'pointerup',102,101);
  expect(visible).toHaveBeenCalledWith(true);
  visible.mockClear();
  trackSelectionToolbarGesture(root,start,false,visible);
  send(root,'pointerup');
  expect(visible).not.toHaveBeenCalled();
 });
 it('detects movement at release and ignores unrelated pointers',()=>{
  const root=new EventTarget(),visible=vi.fn();
  trackSelectionToolbarGesture(root,start,true,visible);
  send(root,'pointermove',200,100,2);send(root,'pointerup',200,100,2);
  expect(visible).not.toHaveBeenCalled();
  send(root,'pointerup',120);
  expect(visible.mock.calls).toEqual([[false]]);
 });
 it('cleans up on cancellation and unmount without reopening',()=>{
  const root=new EventTarget(),visible=vi.fn();
  trackSelectionToolbarGesture(root,start,true,visible);
  send(root,'pointercancel');send(root,'pointerup');
  expect(visible.mock.calls).toEqual([[false]]);
  visible.mockClear();
  const cleanup=trackSelectionToolbarGesture(root,start,true,visible);
  cleanup();send(root,'pointermove',120);send(root,'pointerup');
  expect(visible).not.toHaveBeenCalled();
 });
});
