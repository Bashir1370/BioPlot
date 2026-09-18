import {describe,it,expect,vi,beforeEach} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {ShuffleHero,shuffleOrder} from './components/ui/shuffle-grid';
import {AdminHomeHero} from './AdminHomeHero';
const mocks=vi.hoisted(()=>({upload:vi.fn(),remove:vi.fn(),upsert:vi.fn(),deleteEq:vi.fn(),order:vi.fn(),user:vi.fn()}));
vi.mock('./supabaseClient',()=>({supabase:{auth:{getUser:mocks.user},storage:{from:()=>({upload:mocks.upload,remove:mocks.remove,getPublicUrl:(p:string)=>({data:{publicUrl:`https://assets.test/${p}`}})})},from:()=>({upsert:mocks.upsert,delete:()=>({eq:mocks.deleteEq}),select:()=>({order:mocks.order})})}}));
import {setHomeHeroImage,removeHomeHeroImage,loadHomeHeroImages,HOME_HERO_DEFAULTS} from './homeHero';
import {homeHeroSlots} from './HomeHero';
const old={slot:2 as const,storagePath:'home-hero/old.png',altEn:'Old',altFa:'قبلی',updatedAt:''};
beforeEach(()=>{vi.resetAllMocks();mocks.user.mockResolvedValue({data:{user:{id:'admin'}}});mocks.upload.mockResolvedValue({error:null});mocks.upsert.mockResolvedValue({error:null});mocks.remove.mockResolvedValue({error:null});mocks.deleteEq.mockResolvedValue({error:null});});
describe('Home hero images',()=>{
 it('renders sixteen tiles and working template entry point',()=>{
  const html=renderToStaticMarkup(createElement(ShuffleHero));
  expect(html.match(/class="shuffle-tile"/g)).toHaveLength(16);expect(html).toContain('href="/templates"');expect(html).not.toContain('Trusted by');
 });
 it('renders an independently labelled upload input for every admin image',()=>{
  const html=renderToStaticMarkup(createElement(AdminHomeHero));
  expect(html.match(/type="file"/g)).toHaveLength(16);
  expect(html).toContain('جایگزینی تصویر 16');
 });
 it('shuffles without losing or duplicating image identities',()=>{
  const order=Array.from({length:16},(_,i)=>i);
  const next=shuffleOrder(order,()=>0.999);
  expect(next).not.toEqual(order);expect([...next].sort((a,b)=>a-b)).toEqual(order);
  expect(order).toEqual(Array.from({length:16},(_,i)=>i));
 });
 it('supports slot 16 and rejects slots outside the gallery before uploading',async()=>{
  await setHomeHeroImage(16,new File(['png'],'last.png',{type:'image/png'}));
  expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({slot:16}),{onConflict:'slot'});
  mocks.upload.mockClear();
  for(const slot of [0,17,1.5]) await expect(setHomeHeroImage(slot as 1,new File(['png'],'bad.png',{type:'image/png'}))).rejects.toThrow('Invalid image slot');
  expect(mocks.upload).not.toHaveBeenCalled();
 });
 it('loads the expanded range and ignores invalid records',async()=>{
  mocks.order.mockResolvedValue({data:[{slot:3,storage_path:'home-hero/3.png'},{slot:16,storage_path:'home-hero/16.png'},{slot:17,storage_path:'home-hero/17.png'}],error:null});
  expect((await loadHomeHeroImages()).map(i=>i.slot)).toEqual([3,16]);
 });
 it('maps sparse saved slots in fixed order and falls back independently',()=>{
  const slots=homeHeroSlots([old],'fa');expect(slots).toHaveLength(16);expect(slots[15].src).toBe(HOME_HERO_DEFAULTS[15]);expect(slots[0].src).toBe(HOME_HERO_DEFAULTS[0]);expect(slots[1]).toEqual({src:'https://assets.test/home-hero/old.png',alt:'قبلی'});expect(slots[2].src).toBe(HOME_HERO_DEFAULTS[2]);
 });
 it('replaces an image only after saving its new path',async()=>{
  await setHomeHeroImage(2,new File(['png'],'test.png',{type:'image/png'}),old);
  expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({slot:2,storage_path:expect.stringContaining('home-hero/admin/'),updated_by:'admin'}),{onConflict:'slot'});
  expect(mocks.remove).toHaveBeenCalledWith([old.storagePath]);
  expect(mocks.upsert.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0]);
 });
 it('cleans failed uploads without removing the published image',async()=>{
  mocks.upsert.mockResolvedValue({error:new Error('Denied')});
  await expect(setHomeHeroImage(2,new File(['png'],'test.png',{type:'image/png'}),old)).rejects.toThrow('Denied');
  expect(mocks.remove).not.toHaveBeenCalledWith([old.storagePath]);expect(mocks.remove).toHaveBeenCalledOnce();
 });
 it('rejects invalid files and unauthenticated uploads',async()=>{
  await expect(setHomeHeroImage(1,new File(['bad'],'x.txt',{type:'text/plain'}))).rejects.toThrow();expect(mocks.upload).not.toHaveBeenCalled();
  mocks.user.mockResolvedValue({data:{user:null}});await expect(setHomeHeroImage(1,new File(['png'],'x.png',{type:'image/png'}))).rejects.toThrow();
 });
 it('deletes the saved slot before storage cleanup and reports load errors',async()=>{
  await removeHomeHeroImage(old);expect(mocks.deleteEq).toHaveBeenCalledWith('slot',2);expect(mocks.remove).toHaveBeenCalledWith([old.storagePath]);
  mocks.order.mockResolvedValue({error:new Error('Offline')});await expect(loadHomeHeroImages()).rejects.toThrow('Offline');
 });
});
