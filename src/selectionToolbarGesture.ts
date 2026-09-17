type PointerPosition = Pick<PointerEvent,'pointerId'|'clientX'|'clientY'>;

/** A drag dismisses the toolbar until a later, separate click on artwork. */
export function trackSelectionToolbarGesture(
  root:EventTarget, start:PointerPosition, revealOnClick:boolean, setVisible:(visible:boolean)=>void,
) {
  let dragged=false;
  const checkMovement=(event:PointerPosition)=>{
    if(!dragged&&Math.hypot(event.clientX-start.clientX,event.clientY-start.clientY)>3){
      dragged=true;
      setVisible(false);
    }
  };
  const move=(event:Event)=>{
    const pointer=event as PointerEvent;
    if(pointer.pointerId===start.pointerId)checkMovement(pointer);
  };
  const finish=(event:Event)=>{
    const pointer=event as PointerEvent;
    if(pointer.pointerId!==start.pointerId)return;
    checkMovement(pointer);
    if(!dragged&&revealOnClick)setVisible(true);
    cleanup();
  };
  const cancel=(event:Event)=>{
    if((event as PointerEvent).pointerId!==start.pointerId)return;
    setVisible(false);
    cleanup();
  };
  const blur=()=>{setVisible(false);cleanup();};
  const cleanup=()=>{
    root.removeEventListener('pointermove',move,{capture:true});
    root.removeEventListener('pointerup',finish,{capture:true});
    root.removeEventListener('pointercancel',cancel,{capture:true});
    root.removeEventListener('blur',blur);
  };
  root.addEventListener('pointermove',move,{capture:true});
  root.addEventListener('pointerup',finish,{capture:true});
  root.addEventListener('pointercancel',cancel,{capture:true});
  root.addEventListener('blur',blur);
  return cleanup;
}
