import type { AssetObject } from './model';
import type { LinePoint } from './lineGeometry';

/** Uploaded artwork keeps its identity and thickness while its baseline is edited. */
export function assetLineEndpoints(asset:AssetObject):[LinePoint,LinePoint]{
  const angle=asset.rotation*Math.PI/180;
  const dx=Math.cos(angle)*asset.width/2,dy=Math.sin(angle)*asset.width/2;
  const cx=asset.x+asset.width/2,cy=asset.y+asset.height/2;
  return [{x:cx-dx,y:cy-dy},{x:cx+dx,y:cy+dy}];
}
export function updateAssetLineEndpoint(asset:AssetObject,index:number,point:LinePoint):AssetObject{
  if(asset.locked||!Number.isFinite(point.x)||!Number.isFinite(point.y)||(index!==0&&index!==1))return asset;
  const points=assetLineEndpoints(asset);points[index]=point;
  const [start,end]=points;
  const width=Math.hypot(end.x-start.x,end.y-start.y);
  if(width<2)return asset;
  return {...asset,lineAsset:true,width,x:(start.x+end.x-width)/2,y:(start.y+end.y-asset.height)/2,
    rotation:Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI};
}
