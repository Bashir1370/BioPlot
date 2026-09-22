import {fullAssetLineBounds,type AssetLineBounds} from './assetLineGeometry';
import {readImageBounds} from './tightAssetSelection';
const cache=new Map<string,Promise<AssetLineBounds>>();
/** Rasterize the complete SVG, including embedded PNGs and SVG transforms.
 * Work at bounded resolution and retain normalized anchors at every zoom. */
export function readLineArtworkBounds(svg:string):Promise<AssetLineBounds>{
 const cached=cache.get(svg);if(cached)return cached;
 const job=(async()=>{
  try{
   const root=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;
   if(root.localName!=='svg')return fullAssetLineBounds;
   const box=root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
   const width=box?.[2]||parseFloat(root.getAttribute('width')||'')||300;
   const height=box?.[3]||parseFloat(root.getAttribute('height')||'')||150;
   const scale=Math.min(2,2048/Math.max(width,height));
   root.setAttribute('width',String(Math.max(1,Math.round(width*scale))));
   root.setAttribute('height',String(Math.max(1,Math.round(height*scale))));
   root.setAttribute('xmlns','http://www.w3.org/2000/svg');
   root.setAttribute('preserveAspectRatio','none');
   const source=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(root))}`;
   const pixels=await readImageBounds(source,0);
   if(!pixels)return fullAssetLineBounds;
   return {left:pixels.minX/pixels.width,right:(pixels.maxX+1)/pixels.width,centerY:(pixels.minY+pixels.maxY+1)/(2*pixels.height)};
  }catch{return fullAssetLineBounds;}
 })();
 cache.set(svg,job);return job;
}
