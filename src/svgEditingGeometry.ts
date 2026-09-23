export type ScreenBox={x:number;y:number;width:number;height:number};
export function combinedBox(elements:SVGGraphicsElement[]):ScreenBox|null {
  if(!elements.length)return null;
  const boxes=elements.map(e=>e.getBoundingClientRect());
  const x=Math.min(...boxes.map(b=>b.left)),y=Math.min(...boxes.map(b=>b.top));
  return {x,y,width:Math.max(...boxes.map(b=>b.right))-x,height:Math.max(...boxes.map(b=>b.bottom))-y};
}
export const matrixFrom=(m:DOMMatrix|SVGMatrix)=>new DOMMatrix([m.a,m.b,m.c,m.d,m.e,m.f]);
/** Conjugate a screen-space gesture into each element's parent space. */
export function transformedLocal(parent:DOMMatrix,local:DOMMatrix,gesture:DOMMatrix){return parent.inverse().multiply(gesture).multiply(parent).multiply(local);}
/** Fit the serialized viewport, not the editing camera, to all retained artwork. */
export function fittedSvg(root:SVGSVGElement):string {
  const box=root.getBBox();
  const clone=root.cloneNode(true) as SVGSVGElement;
  if(box.width>0||box.height>0){
    let strokePad=0;
    const rootMatrix=root.getScreenCTM();
    if(rootMatrix){const inverse=matrixFrom(rootMatrix).inverse();
      root.querySelectorAll<SVGGraphicsElement>('path,rect,circle,ellipse,line,polyline,polygon,text,use').forEach(element=>{
        const style=root.ownerDocument.defaultView!.getComputedStyle(element),matrix=element.getScreenCTM();
        if(style.stroke==='none'||!matrix)return;
        const relative=inverse.multiply(matrixFrom(matrix));
        const scale=Math.max(Math.hypot(relative.a,relative.b),Math.hypot(relative.c,relative.d));
        strokePad=Math.max(strokePad,(parseFloat(style.strokeWidth)||0)*scale*Math.max(1,parseFloat(style.strokeMiterlimit)||1)/2);
      });
    }
    const pad=Math.max(1,Math.max(box.width,box.height)*.02,strokePad);
    clone.setAttribute('viewBox',`${box.x-pad} ${box.y-pad} ${Math.max(1,box.width)+2*pad} ${Math.max(1,box.height)+2*pad}`);
  }
  clone.setAttribute('width','100%');clone.setAttribute('height','100%');
  clone.style.removeProperty('width');clone.style.removeProperty('height');
  clone.setAttribute('preserveAspectRatio','xMidYMid meet');
  return new XMLSerializer().serializeToString(clone);
}
