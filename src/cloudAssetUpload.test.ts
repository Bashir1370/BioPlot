// @vitest-environment jsdom
import {beforeEach,describe,it,expect,vi} from 'vitest';
const server=vi.hoisted(()=>({payload:null as Record<string,any>|null,saveError:false,previewError:false,uploads:[] as string[],removed:[] as string[]}));
const thumbnail=vi.hoisted(()=>vi.fn());
vi.mock('./assetThumbnail',()=>({createAssetThumbnail:thumbnail}));
vi.mock('./supabaseClient',()=>({supabase:{
 auth:{getUser:async()=>({data:{user:{id:'admin'}}})},
 storage:{from:()=>({
  getPublicUrl:(path:string)=>({data:{publicUrl:`https://assets.test/${path}`}}),
  upload:async(path:string)=>{server.uploads.push(path);return {error:server.previewError&&path.includes('/previews/')?new Error('Preview upload failed'):null};},
  remove:async(paths:string[])=>{server.removed.push(...paths);return {error:null};},
 })},
 from:()=>{const builder={insert:(payload:Record<string,any>)=>{server.payload=payload;return builder;},update:(payload:Record<string,any>)=>{server.payload=payload;return builder;},eq:()=>builder,select:()=>builder,single:async()=>({data:{...server.payload,id:'saved'},error:server.saveError?new Error('Database failed'):null})};return builder;},
}}));

beforeEach(()=>{vi.resetModules();localStorage.clear();server.payload=null;server.saveError=false;server.previewError=false;server.uploads=[];server.removed=[];thumbnail.mockReset();thumbnail.mockResolvedValue(new Blob(['small'],{type:'image/webp'}));});
async function draft(){return {name:'Cell',category:'Cell biology',synonyms:{en:[],fa:[]},renderSvg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9"/></svg>',sourceType:'svg' as const,reviewStatus:'reviewed' as const,premium:false,active:true,featured:false};}
const file=()=>new File(['original'],'cell.svg',{type:'image/svg+xml'});

describe('published upload derivatives',()=>{
 it('saves the small derivative separately while retaining exact editable artwork',async()=>{
  const library=await import('./cloudAssetLibrary');const value=await draft();const saved=await library.saveCloudAsset(value,file());
  expect(server.uploads).toHaveLength(2);expect(server.payload?.metadata.thumbnail_path).toMatch(/^library\/admin\/previews\/.+\.webp$/);
  expect(server.payload?.render_svg).toContain('<circle');expect(saved.thumbnailPath).toBe(server.payload?.metadata.thumbnail_path);expect(server.removed).toEqual([]);
 });
 it('still saves the original if preview encoding or storage fails',async()=>{
  const library=await import('./cloudAssetLibrary');server.previewError=true;
  const saved=await library.saveCloudAsset(await draft(),file());expect(saved.storagePath).toBeTruthy();expect(server.payload?.metadata.thumbnail_path).toBeUndefined();
  thumbnail.mockRejectedValueOnce(new Error('Canvas unavailable'));server.previewError=false;
  await expect(library.saveCloudAsset(await draft(),file())).resolves.toBeDefined();
 });
 it('cleans up both new files when the database write fails',async()=>{
  const library=await import('./cloudAssetLibrary');server.saveError=true;
  await expect(library.saveCloudAsset(await draft(),file())).rejects.toThrow('Database failed');
  expect(server.removed).toEqual(server.uploads);
 });
 it('keeps an existing derivative on metadata-only edits',async()=>{
  const library=await import('./cloudAssetLibrary');const existing=await library.saveCloudAsset(await draft(),file());
  server.uploads=[];thumbnail.mockClear();await library.saveCloudAsset(await draft(),null,existing);
  expect(thumbnail).not.toHaveBeenCalled();expect(server.uploads).toEqual([]);expect(server.payload?.metadata.thumbnail_path).toBe(existing.thumbnailPath);
 });
 it('removes replaced source and preview only after a successful database update',async()=>{
  const library=await import('./cloudAssetLibrary');const existing=await library.saveCloudAsset(await draft(),file());
  server.uploads=[];await library.saveCloudAsset(await draft(),file(),existing);
  expect(server.removed).toEqual([existing.storagePath,existing.thumbnailPath]);expect(server.removed.some(path=>server.uploads.includes(path))).toBe(false);
 });
});
