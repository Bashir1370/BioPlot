import type {ShapeObject} from './model';
export const SHAPE_CATALOG: {shape:ShapeObject['shape'];en:string;fa:string}[] = [
  {shape:'rect',en:'Rectangle',fa:'مستطیل'}, {shape:'rounded',en:'Rounded',fa:'گوشه‌گرد'},
  {shape:'ellipse',en:'Ellipse',fa:'بیضی'}, {shape:'circle',en:'Circle',fa:'دایره'},
  {shape:'triangle',en:'Triangle',fa:'مثلث'}, {shape:'diamond',en:'Diamond',fa:'لوزی'},
  {shape:'pentagon',en:'Pentagon',fa:'پنج‌ضلعی'}, {shape:'hexagon',en:'Hexagon',fa:'شش‌ضلعی'},
  {shape:'star',en:'Star',fa:'ستاره'}, {shape:'trapezoid',en:'Trapezoid',fa:'ذوزنقه'},
  {shape:'parallelogram',en:'Parallelogram',fa:'متوازی‌الاضلاع'}, {shape:'cross',en:'Cross',fa:'صلیب'}
];
const escape=(value:string)=>value.replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]!));
/** Shared by canvas, library previews and export; inset strokes stay inside the selection. */
export function shapeSvgBody(object:ShapeObject):string {
  const inset=Math.min(object.strokeWidth/2,object.width/2,object.height/2),w=Math.max(0,object.width-2*inset),h=Math.max(0,object.height-2*inset);
  const style=`fill="${escape(object.fill)}" stroke="${escape(object.stroke)}" stroke-width="${object.strokeWidth}" stroke-linejoin="round"${object.lineStyle==='dashed'?' stroke-dasharray="9 6"':object.lineStyle==='dotted'?' stroke-dasharray="1 5" stroke-linecap="round"':''}`;
  if(object.shape==='ellipse'||object.shape==='circle')return `<ellipse cx="${object.width/2}" cy="${object.height/2}" rx="${w/2}" ry="${h/2}" ${style}/>`;
  if(object.shape==='rect'||object.shape==='rounded')return `<rect x="${inset}" y="${inset}" width="${w}" height="${h}" rx="${Math.min(object.radius,w/2,h/2)}" ${style}/>`;
  let points:number[][];
  switch(object.shape){
    case 'triangle':points=[[.5,0],[1,1],[0,1]];break;
    case 'diamond':points=[[.5,0],[1,.5],[.5,1],[0,.5]];break;
    case 'trapezoid':points=[[.25,0],[.75,0],[1,1],[0,1]];break;
    case 'parallelogram':points=[[.25,0],[1,0],[.75,1],[0,1]];break;
    case 'cross':points=[[.33,0],[.67,0],[.67,.33],[1,.33],[1,.67],[.67,.67],[.67,1],[.33,1],[.33,.67],[0,.67],[0,.33],[.33,.33]];break;
    default:{
      const count=object.shape==='star'?10:object.shape==='pentagon'?5:6;
      points=Array.from({length:count},(_,i)=>{const angle=-Math.PI/2+i*2*Math.PI/count,r=object.shape==='star'&&i%2?.23:.5;return [.5+Math.cos(angle)*r,.5+Math.sin(angle)*r];});
    }
  }
  return `<polygon points="${points.map(([x,y])=>`${inset+x*w},${inset+y*h}`).join(' ')}" ${style}/>`;
}
