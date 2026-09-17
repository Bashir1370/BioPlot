import { type ReactNode, type RefObject, useLayoutEffect, useRef } from 'react';
import { floatingToolbarPosition } from './floatingToolbarPosition';

export function FloatingSelectionToolbar({viewportRef,artboardRef,children,label}:{
  viewportRef:RefObject<HTMLDivElement|null>;
  artboardRef:RefObject<HTMLDivElement|null>;
  children:ReactNode;
  label:string;
}) {
  const ref=useRef<HTMLDivElement>(null);
  // Re-measure after every selection/geometry render, including drag previews.
  useLayoutEffect(()=>{
    const toolbar=ref.current, viewport=viewportRef.current, artboard=artboardRef.current;
    if(!toolbar||!viewport||!artboard)return;
    const update=()=>{
      const selection=artboard.querySelector('.studio-selection');
      if(!selection)return;
      const area=viewport.getBoundingClientRect();
      toolbar.style.maxWidth=`${Math.max(0,area.width-20)}px`;
      const position=floatingToolbarPosition(selection.getBoundingClientRect(),area,toolbar.getBoundingClientRect());
      toolbar.style.left=`${position.left}px`;
      toolbar.style.top=`${position.top}px`;
      toolbar.style.visibility=position.visible?'visible':'hidden';
      toolbar.dataset.popover=position.top+toolbar.offsetHeight+190>area.bottom?'above':'below';
    };
    const toggle=(event:Event)=>{
      const target=event.target;
      if(target instanceof HTMLDetailsElement&&target.open)
        toolbar.querySelectorAll('details[open]').forEach(detail=>{if(detail!==target)detail.removeAttribute('open');});
    };
    toolbar.addEventListener('toggle',toggle,true);
    update();
    const observer=new ResizeObserver(update);
    observer.observe(viewport);observer.observe(toolbar);observer.observe(artboard);
    // Tight asset bounds can be updated after React commits.
    const selection=artboard.querySelector('.studio-selection');
    const mutation=new MutationObserver(update);
    if(selection)mutation.observe(selection,{attributes:true,attributeFilter:['style']});
    viewport.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    return()=>{toolbar.removeEventListener('toggle',toggle,true);observer.disconnect();mutation.disconnect();viewport.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
  });
  return <div ref={ref} className="floating-selection-toolbar" role="group" aria-label={label}
    onPointerDown={event=>event.stopPropagation()} onDoubleClick={event=>event.stopPropagation()}
    >{children}</div>;
}
