import {describe,expect,it} from 'vitest';
import {connectorPath,objectPortPoint,resolveConnector} from './connectors';
import {makeShape,makeConnector} from './editorObjects';
describe('attached connectors',()=>{
 it.each([[300,200],[-200,200],[10,400],[-200,-200]])('preserves both world-space endpoints at target (%s,%s)',(x,y)=>{
  const from=makeShape('rect',10,30),to=makeShape('rect',x,y);
  const connector={...makeConnector('straight'),fromObjectId:from.id,toObjectId:to.id,fromPort:'right' as const,toPort:'left' as const};
  const resolved=resolveConnector(connector,[from,to]);
  const start=objectPortPoint(from,'right'),end=objectPortPoint(to,'left');
  expect(resolved.x+resolved.startPoint!.x*resolved.width).toBeCloseTo(start.x);
  expect(resolved.y+resolved.startPoint!.y*resolved.height).toBeCloseTo(start.y);
  expect(resolved.x+resolved.endPoint!.x*resolved.width).toBeCloseTo(end.x);
  expect(resolved.y+resolved.endPoint!.y*resolved.height).toBeCloseTo(end.y);
  expect(connectorPath(resolved)).toContain(' L');
 });
 it('rotates explicit attachment ports with the attached object',()=>{
  const object={...makeShape('rect',100,100),width:100,height:20,rotation:90};
  expect(objectPortPoint(object,'right').x).toBeCloseTo(150);
  expect(objectPortPoint(object,'right').y).toBeCloseTo(160);
 });
});
