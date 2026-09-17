import {describe,it,expect,vi,beforeEach} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {Hero10} from './components/ui/hero-10';
const mocks=vi.hoisted(()=>({upload:vi.fn(),remove:vi.fn(),upsert:vi.fn(),deleteEq:vi.fn(),order:vi.fn(),user:vi.fn()}));
vi.mock('./supabaseClient',()=>({supabase:{auth:{getUser:mocks.user},storage:{from:()=>({upload:mocks.upload,remove:mocks.remove,getPublicUrl:(p:string)=>({data:{publicUrl:`https://assets.test/${p}`}})})},from:()=>({upsert:mocks.upsert,delete:()=>({eq:mocks.deleteEq}),select:()=>({order:mocks.order})})}}));
import {setHomeHeroImage,removeHomeHeroImage,loadHomeHeroImages,HOME_HERO_DEFAULTS} from './homeHero';
import {homeHeroSlots} from './HomeHero';
const old={slot:2 as const,storagePath:'home-hero/old.png',altEn:'Old',altFa:'قبلی',updatedAt:''};
beforeEach(()=>{vi.resetAllMocks();mocks.user.mockResolvedValue({data:{user:{id:'admin'}}});mocks.upload.mockResolvedValue({error:null});mocks.upsert.mockResolvedValue({error:null});mocks.remove.mockResolvedValue({error:null});mocks.deleteEq.mockResolvedValue({error:null});});
describe('Home hero images',()=>{
 it('renders three frames, CTA links and no invented social proof',()=>{
  const html=renderToStaticMarkup(createElement(Hero10,{title:'Your science.',titleHighlight:'Clearly illustrated.',description:'BioPlot',images:HOME_HERO_DEFAULTS,imageAlts:['One','Two','Three'],secondaryCTA:{ctaEnabled:true,text:'Templates',link:'/templates',variant:'outline'}}));
  expect(html.match(/<figure /g)).toHaveLength(3);expect(html).toContain('href="/templates"');expect(html).not.toContain('Trusted by');
 });
 it('maps sparse saved slots in fixed order and falls back independently',()=>{
  const slots=homeHeroSlots([old],'fa');expect(slots[0].src).toBe(HOME_HERO_DEFAULTS[0]);expect(slots[1]).toEqual({src:'https://assets.test/home-hero/old.png',alt:'قبلی'});expect(slots[2].src).toBe(HOME_HERO_DEFAULTS[2]);
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
