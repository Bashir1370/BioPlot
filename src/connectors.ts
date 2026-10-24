import { BioPlotObject, ConnectorObject, ConnectorPort } from './model';

export interface Point { x:number; y:number; }

function center(object:BioPlotObject):Point{
  return {x:object.x+object.width/2,y:object.y+object.height/2};
}

export function objectPortPoint(object:BioPlotObject,port:ConnectorPort='auto',toward?:Point):Point{
  const c=center(object);
  if(port==='center') return c;
  const angle=object.rotation*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  if(port==='auto'){
    const dx=toward?((toward.x-c.x)*cos+(toward.y-c.y)*sin):1;
    const dy=toward?(-(toward.x-c.x)*sin+(toward.y-c.y)*cos):0;
    port=Math.abs(dx)>=Math.abs(dy)?(dx>=0?'right':'left'):(dy>=0?'bottom':'top');
  }
  const dx=port==='left'?-object.width/2:port==='right'?object.width/2:0;
  const dy=port==='top'?-object.height/2:port==='bottom'?object.height/2:0;
  return {x:c.x+dx*cos-dy*sin,y:c.y+dx*sin+dy*cos};
}

export function resolveConnector(connector:ConnectorObject,objects:BioPlotObject[]):ConnectorObject{
  const from=connector.fromObjectId?objects.find(object=>object.id===connector.fromObjectId):undefined;
  const to=connector.toObjectId?objects.find(object=>object.id===connector.toObjectId):undefined;
  if(!from&&!to) return connector;
  const fromCenter=from?center(from):{x:connector.x,y:connector.y+connector.height/2};
  const toCenter=to?center(to):{x:connector.x+connector.width,y:connector.y+connector.height/2};
  const start=from?objectPortPoint(from,connector.fromPort??'auto',toCenter):fromCenter;
  const end=to?objectPortPoint(to,connector.toPort??'auto',fromCenter):toCenter;
  const x=Math.min(start.x,end.x);
  const y=Math.min(start.y,end.y)-18;
  const width=Math.max(24,Math.abs(end.x-start.x));
  const height=Math.max(36,Math.abs(end.y-start.y)+36);
  return {...connector,x,y,width,height,rotation:0,
    startPoint:{x:(start.x-x)/width,y:(start.y-y)/height},
    endPoint:{x:(end.x-x)/width,y:(end.y-y)/height}};
}

export function connectorPath(object:ConnectorObject){
  if(object.startPoint&&object.endPoint){
    const start={x:object.startPoint.x*object.width,y:object.startPoint.y*object.height};
    const end={x:object.endPoint.x*object.width,y:object.endPoint.y*object.height};
    const mid=(start.x+end.x)/2;
    if(object.route==='elbow')return `M${start.x} ${start.y} H${mid} V${end.y} H${end.x}`;
    if(object.route==='curved')return `M${start.x} ${start.y} C${mid} ${start.y} ${mid} ${end.y} ${end.x} ${end.y}`;
    return `M${start.x} ${start.y} L${end.x} ${end.y}`;
  }
  const mid=object.height/2;
  if(object.route==='elbow') return `M4 ${mid} H${object.width/2} V${Math.max(8,object.height-8)} H${object.width-9}`;
  if(object.route==='curved') return `M4 ${mid} C${object.width*.3} 3 ${object.width*.7} ${object.height-3} ${object.width-9} ${mid}`;
  return `M4 ${mid} H${object.width-9}`;
}

export function attachConnector(connector:ConnectorObject,fromObjectId?:string,toObjectId?:string):ConnectorObject{
  return {...connector,fromObjectId,toObjectId,fromPort:connector.fromPort??'auto',toPort:connector.toPort??'auto',autoRoute:true};
}

export function connectorCandidates(objects:BioPlotObject[],connectorId:string){
  return objects.filter(object=>object.id!==connectorId&&object.type!=='connector'&&!object.hidden);
}
