/** SVG path editing without flattening curves or rasterizing artwork. */
export type Segment = { command: string; values: number[] };
export type NodeHandle = { segment: number; offset: number; x: number; y: number; control: boolean };
const counts: Record<string, number> = { M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0 };
export function parsePath(source: string): Segment[] {
  let rest=source.trim(), command='', x=0,y=0,mx=0,my=0;
  const result:Segment[]=[];
  const number=(flag=false)=>{
    rest=rest.replace(/^[\s,]+/,'');
    const match=rest.match(flag?/^[01]/:/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    if(!match)throw new Error('Invalid SVG path');
    rest=rest.slice(match[0].length);const value=Number(match[0]);
    if(!Number.isFinite(value))throw new Error('Invalid SVG coordinate');
    return value;
  };
  while(rest.trim()){
    rest=rest.replace(/^[\s,]+/,'');if(!rest)break;
    if(/^[a-z]/i.test(rest)){command=rest[0];rest=rest.slice(1);}
    const upper=command.toUpperCase(), count=counts[upper];
    if(count===undefined||(!result.length&&upper!=='M'))throw new Error('Invalid SVG command');
    if(upper==='Z'){result.push({command:'Z',values:[]});x=mx;y=my;command='';continue;}
    const values=Array.from({length:count},(_,i)=>number(upper==='A'&&(i===3||i===4)));
    const relative=command!==upper;
    let normalized=upper;
    if(upper==='H'){values[0]+=relative?x:0;values.push(y);normalized='L';}
    else if(upper==='V'){values[0]+=relative?y:0;values.unshift(x);normalized='L';}
    else if(relative){for(let i=upper==='A'?5:0;i<values.length;i+=2){values[i]+=x;values[i+1]+=y;}}
    // Expand reflected handles before editing so neighboring edits remain explicit.
    const previous=result[result.length-1];
    if(upper==='S'){
      const p=previous?.command==='C'?previous.values.slice(2,4):[x,y];
      values.unshift(2*x-p[0],2*y-p[1]);normalized='C';
    }else if(upper==='T'){
      const p=previous?.command==='Q'?previous.values.slice(0,2):[x,y];
      values.unshift(2*x-p[0],2*y-p[1]);normalized='Q';
    }
    x=values[values.length-2];y=values[values.length-1];
    if(upper==='M'){mx=x;my=y;command=relative?'l':'L';}
    result.push({command:normalized,values});
    if(result.length>10000)throw new Error('Path too large for node editing');
  }
  return result;
}
export const pathString=(segments:Segment[])=>segments.map(s=>s.command+s.values.map(v=>Number(v.toFixed(6))).join(' ')).join(' ');
export function pathHandles(segments:Segment[]):NodeHandle[]{
  return segments.flatMap((s,segment)=>{
    if(s.command==='Z')return [];
    const offsets=s.command==='A'?[5]:Array.from({length:s.values.length/2},(_,i)=>i*2);
    return offsets.map(offset=>({segment,offset,x:s.values[offset],y:s.values[offset+1],control:offset<s.values.length-2}));
  });
}
export function movePathHandle(segments:Segment[],handle:NodeHandle,x:number,y:number):Segment[]{
  const next=structuredClone(segments);next[handle.segment].values[handle.offset]=x;next[handle.segment].values[handle.offset+1]=y;return next;
}
export function deletePathNode(segments:Segment[],index:number):Segment[]{
  if(!segments[index]||segments[index].command==='Z')return segments;
  let start=index;while(start>0&&segments[start].command!=='M')start--;
  let end=start+1;while(end<segments.length&&segments[end].command!=='M')end++;
  const closed=segments[end-1].command==='Z',count=end-start-(closed?1:0);
  if(count<=(closed?3:2))return segments;
  const next=structuredClone(segments);
  next.splice(index,1);
  if(index===start)next[start]={command:'M',values:next[start].values.slice(-2)};
  return next;
}
/** Primitives are converted only when the user enters node mode. */
export function primitivePath(element:Element):string|null {
  const n=(name:string,fallback=0)=>{const v=element.getAttribute(name);if(v!==null&&!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:px)?$/i.test(v.trim()))throw new Error('Resolve percentage/unit geometry before editing nodes');return v===null?fallback:parseFloat(v);};
  const tag=element.localName;
  if(tag==='path')return pathString(parsePath(element.getAttribute('d')??''));
  if(tag==='polygon'||tag==='polyline'){
    const points=(element.getAttribute('points')??'').trim();
    return pathString(parsePath(`M${points}${tag==='polygon'?' Z':''}`));
  }
  if(tag==='line')return `M${n('x1')} ${n('y1')} L${n('x2')} ${n('y2')}`;
  if(tag==='rect'){
    const x=n('x'),y=n('y'),w=n('width'),h=n('height'),rx=Math.min(w/2,Math.max(0,n('rx',n('ry')))),ry=Math.min(h/2,Math.max(0,n('ry',rx)));
    if(!rx||!ry)return `M${x} ${y} L${x+w} ${y} L${x+w} ${y+h} L${x} ${y+h} Z`;
    return `M${x+rx} ${y} H${x+w-rx} A${rx} ${ry} 0 0 1 ${x+w} ${y+ry} V${y+h-ry} A${rx} ${ry} 0 0 1 ${x+w-rx} ${y+h} H${x+rx} A${rx} ${ry} 0 0 1 ${x} ${y+h-ry} V${y+ry} A${rx} ${ry} 0 0 1 ${x+rx} ${y} Z`;
  }
  if(tag==='circle'||tag==='ellipse'){
    const x=n('cx'),y=n('cy'),rx=n(tag==='circle'?'r':'rx'),ry=n(tag==='circle'?'r':'ry'),k=.5522847498307936;
    return `M${x+rx} ${y} C${x+rx} ${y+k*ry} ${x+k*rx} ${y+ry} ${x} ${y+ry} C${x-k*rx} ${y+ry} ${x-rx} ${y+k*ry} ${x-rx} ${y} C${x-rx} ${y-k*ry} ${x-k*rx} ${y-ry} ${x} ${y-ry} C${x+k*rx} ${y-ry} ${x+rx} ${y-k*ry} ${x+rx} ${y} Z`;
  }
  return null;
}

/** Split a line/quadratic/cubic exactly at t=.5, retaining its original outline. */
export function insertPathNode(segments:Segment[],index:number):Segment[]{
  const current=segments[index];if(!current||current.command==='Z')return segments;
  const start=current.values.slice(-2),nextIndex=index+1,target=segments[nextIndex];
  if(!target||target.command==='M'||target.command==='A')return segments;
  const mid=(a:number[],b:number[])=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const output=structuredClone(segments);
  if(target.command==='Z'){
    let first=index;while(first>0&&segments[first].command!=='M')first--;
    output.splice(nextIndex,0,{command:'L',values:mid(start,segments[first].values)});
  }else if(target.command==='L')output.splice(nextIndex,0,{command:'L',values:mid(start,target.values)});
  else if(target.command==='Q'){
    const control=target.values.slice(0,2),end=target.values.slice(2),a=mid(start,control),b=mid(control,end),c=mid(a,b);
    output.splice(nextIndex,1,{command:'Q',values:[...a,...c]},{command:'Q',values:[...b,...end]});
  }else if(target.command==='C'){
    const first=target.values.slice(0,2),second=target.values.slice(2,4),end=target.values.slice(4),a=mid(start,first),b=mid(first,second),c=mid(second,end),d=mid(a,b),e=mid(b,c),f=mid(d,e);
    output.splice(nextIndex,1,{command:'C',values:[...a,...d,...f]},{command:'C',values:[...e,...c,...end]});
  }
  return output;
}
