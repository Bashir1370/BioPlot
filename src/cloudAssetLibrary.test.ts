// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import {beforeEach,describe,expect,it,vi} from 'vitest';
const server=vi.hoisted(()=>({rows:[] as Record<string,any>[],requests:[] as Array<{columns:string;from:number;to:number;id?:string}>,failPage:false,failArtwork:false}));
vi.mock('./supabaseClient',()=>({supabase:{storage:{from:()=>({getPublicUrl:(path:string)=>({data:{publicUrl:`https://assets.test/${path}`}})})},from:()=>{
 const request={columns:'',from:0,to:99,id:undefined as string|undefined};
 const builder={
  select:(columns:string)=>{request.columns=columns;return builder;},
  eq:(key:string,value:unknown)=>{if(key==='id')request.id=String(value);return builder;},
  order:()=>builder,range:(from:number,to:number)=>{request.from=from;request.to=to;return builder;},abortSignal:()=>builder,single:()=>builder,
  then:(resolve:(value:unknown)=>unknown,reject:(error:unknown)=>unknown)=>{
   server.requests.push({...request});
   if((request.id&&server.failArtwork)||(!request.id&&request.from>=100&&server.failPage))return Promise.resolve({data:null,error:new Error('Temporary failure')}).then(resolve,reject);
   const found=server.rows.find(row=>row.id===request.id);
   const data=request.id?(request.columns==='render_svg'?{render_svg:found?.render_svg}:request.columns.startsWith('legacy_svg:')?{legacy_svg:found?.metadata?.render_svg}:found):server.rows.slice(request.from,request.to+1).map(({render_svg,metadata,...row})=>row);
   return Promise.resolve({data,error:null}).then(resolve,reject);
  },
 };return builder;
}}}));
function row(id:number){return {id:String(id).padStart(4,'0'),name:`Asset ${id}`,category:id%2?'Cell biology':'Lines & Arrows',asset_type:'svg',is_published:true,storage_path:`library/${id}.svg`,render_svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><script>alert(1)</script><path d="M0 10h100" stroke="#000"/></svg>',version:1};}
async function cacheDb(){return new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('bioplot-cloud-library-cache-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('library');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function storedArtwork(){const db=await cacheDb();return new Promise<Array<[IDBValidKey,unknown]>>(resolve=>{const entries:Array<[IDBValidKey,unknown]>=[];const tx=db.transaction('library','readonly');const request=tx.objectStore('library').openCursor();request.onsuccess=()=>{const cursor=request.result;if(cursor){entries.push([cursor.key,cursor.value]);cursor.continue();}};tx.oncomplete=()=>{db.close();resolve(entries);};});}
beforeEach(async()=>{vi.resetModules();localStorage.clear();server.rows=Array.from({length:67},(_,i)=>row(i));server.requests=[];server.failPage=false;server.failArtwork=false;const db=await cacheDb();await new Promise<void>(resolve=>{const tx=db.transaction('library','readwrite');tx.objectStore('library').clear();tx.oncomplete=()=>resolve();});db.close();});
describe('lightweight cloud catalog and on-demand artwork',()=>{
 it('makes all 67 assets searchable without downloading their full SVG payloads',async()=>{
  const library=await import('./cloudAssetLibrary');const assets=await library.syncPublishedCloudAssetsToBrowserCache();
  expect(assets).toHaveLength(67);expect(assets.every(asset=>asset.svg===''&&asset.artworkLoaded===false&&asset.previewUrl)).toBe(true);
  expect(server.requests).toHaveLength(1);expect(server.requests[0].columns).not.toContain('render_svg');expect(server.requests[0].columns).not.toBe('*');
  const {getAssetCatalog,searchAssets}=await import('./assets');
  expect(getAssetCatalog()).toHaveLength(67);expect(searchAssets('Asset 12')).toHaveLength(1);
  expect(localStorage.getItem('bioplot_v3_custom_assets')).toBeNull();
 });
 it('paginates beyond one server page and shares overlapping refresh requests',async()=>{
  server.rows=Array.from({length:203},(_,i)=>row(i));
  const library=await import('./cloudAssetLibrary');
  const first=library.syncPublishedCloudAssetsToBrowserCache(),second=library.syncPublishedCloudAssetsToBrowserCache();
  expect(first).toBe(second);expect(await first).toHaveLength(203);
  expect(server.requests.map(request=>[request.from,request.to])).toEqual([[0,99],[100,199],[200,299]]);
 });
 it('retains already-received catalog pages on failure and can retry immediately',async()=>{
  server.rows=Array.from({length:103},(_,i)=>row(i));server.failPage=true;
  const library=await import('./cloudAssetLibrary');
  await expect(library.syncPublishedCloudAssetsToBrowserCache()).rejects.toThrow('Temporary failure');
  expect(library.loadCachedPublishedCloudAssets()).toHaveLength(100);
  server.failPage=false;expect(await library.syncPublishedCloudAssetsToBrowserCache()).toHaveLength(103);
 });
 it('never turns a metadata-only catalog entry into an invisible canvas object',async()=>{
  const library=await import('./cloudAssetLibrary');const [asset]=await library.loadPublishedCloudAssets();
  const {assetToObject}=await import('./assets');
  expect(()=>assetToObject(asset)).toThrow('Load asset artwork before insertion.');
  expect(assetToObject(await library.loadCloudAssetArtwork(asset)).svg).toContain('<path');
 });
 it('loads and sanitizes only the selected artwork, sharing concurrent insert requests',async()=>{
  const library=await import('./cloudAssetLibrary');const [asset]=await library.loadPublishedCloudAssets();server.requests=[];
  const [a,b]=await Promise.all([library.loadCloudAssetArtwork(asset),library.loadCloudAssetArtwork(asset)]);
  expect(a).toBe(b);expect(a.artworkLoaded).toBe(true);expect(a.svg).toContain('<path');expect(a.svg).not.toContain('<script');
  expect(server.requests).toHaveLength(1);expect(server.requests[0].id).toBe(asset.id);
  expect(server.requests[0].columns).toBe('render_svg');
 });
 it('reuses downloaded artwork after reload but fetches new asset versions',async()=>{
  let library=await import('./cloudAssetLibrary');const [asset]=await library.loadPublishedCloudAssets();
  await library.loadCloudAssetArtwork(asset);
  await vi.waitFor(async()=>expect((await storedArtwork()).some(([key])=>String(key).startsWith('artwork:'))).toBe(true));
  vi.resetModules();library=await import('./cloudAssetLibrary');server.requests=[];server.failArtwork=true;
  expect((await library.loadCloudAssetArtwork(asset)).svg).toContain('<path');expect(server.requests).toHaveLength(0);
  server.failArtwork=false;
  await library.loadCloudAssetArtwork({...asset,version:2});expect(server.requests).toHaveLength(1);
 });
 it('reads legacy artwork only when the primary field is empty',async()=>{
  const original=server.rows[0].render_svg;server.rows[0].render_svg='';server.rows[0].metadata={render_svg:original};
  const library=await import('./cloudAssetLibrary');const [asset]=await library.loadPublishedCloudAssets();server.requests=[];
  expect((await library.loadCloudAssetArtwork(asset)).svg).toContain('<path');
  expect(server.requests.map(request=>request.columns)).toEqual(['render_svg','legacy_svg:metadata->>render_svg']);
 });
 it('recovers from corrupt cached SVG instead of leaving an asset unusable',async()=>{
  const library=await import('./cloudAssetLibrary');const [asset]=await library.loadPublishedCloudAssets();
  const db=await cacheDb();await new Promise<void>(resolve=>{const tx=db.transaction('library','readwrite');tx.objectStore('library').put('<invalid>',`artwork:${JSON.stringify([asset.id,asset.version,asset.storagePath])}`);tx.oncomplete=()=>resolve();});db.close();server.requests=[];
  expect((await library.loadCloudAssetArtwork(asset)).svg).toContain('<path');expect(server.requests).toHaveLength(1);
 });
 it('bounds persistent artwork caching while preserving the lightweight catalog',async()=>{
  const library=await import('./cloudAssetLibrary');const assets=await library.syncPublishedCloudAssetsToBrowserCache();
  for(const asset of assets.slice(0,26))await library.loadCloudAssetArtwork(asset);
  await vi.waitFor(async()=>expect((await storedArtwork()).filter(([key])=>String(key).startsWith('artwork:'))).toHaveLength(24));
  const entries=await storedArtwork();expect(entries.some(([key])=>key==='published-assets')).toBe(true);
  expect(entries.some(([key])=>key===`artwork:${JSON.stringify([assets[0].id,assets[0].version,assets[0].storagePath])}`)).toBe(false);
 });
 it('allows retry after a failed artwork request and preserves the catalog entry',async()=>{
  const library=await import('./cloudAssetLibrary');const [asset]=await library.loadPublishedCloudAssets();server.failArtwork=true;
  await expect(library.loadCloudAssetArtwork(asset)).rejects.toThrow('Temporary failure');
  expect(asset.artworkLoaded).toBe(false);server.failArtwork=false;
  expect((await library.loadCloudAssetArtwork(asset)).svg).toContain('<path');
 });
 it('does not let an older IndexedDB hydration overwrite a newer cloud catalog',async()=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('bioplot-cloud-library-cache-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('library');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  await new Promise<void>(resolve=>{const tx=db.transaction('library','readwrite');tx.objectStore('library').put([{...row(999),name:'Stale asset',svg:'<svg/>',active:true,cloudManaged:true}],'published-assets');tx.oncomplete=()=>resolve();});db.close();
  const library=await import('./cloudAssetLibrary');
  const hydration=library.hydratePublishedCloudAssetsFromIndexedDb();await library.syncPublishedCloudAssetsToBrowserCache();await hydration;
  expect(library.loadCachedPublishedCloudAssets()).toHaveLength(67);expect(library.loadCachedPublishedCloudAssets().some(asset=>asset.name==='Stale asset')).toBe(false);
 });
});
