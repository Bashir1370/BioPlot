import { BioPlotObject, ConnectorObject, ConnectorPort } from './model';

export interface Point { x:number; y:number; }

function center(object:BioPlotObject):Point{
  return {x:object.x+object.width/2,y:object.y+object.height/2};
}

export function objectPortPoint(object:BioPlotObject,port:ConnectorPort='auto',toward?:Point):Point{
  const c=center(object);
  if(port==='center') return c;
  if(port==='top') return {x:c.x,y:object.y};
  if(port==='right') return {x:object.x+object.width,y:c.y};
  if(port==='bottom') return {x:c.x,y:object.y+object.height};
  if(port==='left') return {x:object.x,y:c.y};
  if(!toward) return {x:object.x+object.width,y:c.y};
  const dx=toward.x-c.x,dy=toward.y-c.y;
  if(Math.abs(dx)>=Math.abs(dy)) return dx>=0?{x:object.x+object.width,y:c.y}:{x:object.x,y:c.y};
  return dy>=0?{x:c.x,y:object.y+object.height}:{x:c.x,y:object.y};
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
  const reverse=end.x<start.x;
  return {...connector,x,y,width,height,rotation:reverse?180:0};
}

export function connectorPath(object:ConnectorObject){
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
