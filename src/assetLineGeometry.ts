import type { AssetObject } from './model';
import type { LinePoint } from './lineGeometry';

export interface AssetLineBounds {left:number;right:number;centerY:number}
export const fullAssetLineBounds:AssetLineBounds={left:0,right:1,centerY:.5};

/** Anchors follow visible artwork, not the transparent margins of its file. */
export function assetLineEndpoints(asset:AssetObject,bounds:AssetLineBounds=fullAssetLineBounds):[LinePoint,LinePoint]{
 const angle=asset.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const cx=asset.x+asset.width/2,cy=asset.y+asset.height/2;
 const point=(fraction:number)=>{
  const x=(fraction-.5)*asset.width,y=(bounds.centerY-.5)*asset.height;
  return {x:cx+c*x-s*y,y:cy+s*x+c*y};
 };
 return [point(bounds.left),point(bounds.right)];
}
export function updateAssetLineEndpoint(asset:AssetObject,index:number,point:LinePoint,bounds:AssetLineBounds=fullAssetLineBounds):AssetObject{
 if(asset.locked||!Number.isFinite(point.x)||!Number.isFinite(point.y)||(index!==0&&index!==1))return asset;
 const points=assetLineEndpoints(asset,bounds);points[index]=point;
 const [start,end]=points,span=bounds.right-bounds.left;
 const length=Math.hypot(end.x-start.x,end.y-start.y);
 if(length<2||span<=0)return asset;
 const width=length/span,angle=Math.atan2(end.y-start.y,end.x-start.x);
 const offsetX=((bounds.left+bounds.right)/2-.5)*width,offsetY=(bounds.centerY-.5)*asset.height;
 const cx=(start.x+end.x)/2-Math.cos(angle)*offsetX+Math.sin(angle)*offsetY;
 const cy=(start.y+end.y)/2-Math.sin(angle)*offsetX-Math.cos(angle)*offsetY;
 return {...asset,lineAsset:true,width,x:cx-width/2,y:cy-asset.height/2,rotation:angle*180/Math.PI};
}
