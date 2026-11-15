import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const mocks=vi.hoisted(()=>({read:vi.fn(),upsert:vi.fn(),user:vi.fn()}));
vi.mock('./supabaseClient',()=>({supabase:{auth:{getUser:mocks.user},from:()=>({select:()=>({eq:()=>({maybeSingle:mocks.read})}),upsert:mocks.upsert})}}));
import {HomeBanner} from './HomeBanner';
import {HOME_BANNER_DEFAULTS,normalizeHomeBanner} from './homeBannerContent';
import {HOME_TEXT_DEFAULTS,normalizeHomeContent,saveHomeContent,loadHomeContent} from './homeContent';
beforeEach(()=>{vi.resetAllMocks();mocks.user.mockResolvedValue({data:{user:{id:'admin'}},error:null});mocks.upsert.mockResolvedValue({error:null});});
describe('Photographic Home banner',()=>{
 it('renders the supplied background and requested copy immediately in each language',()=>{
  for(const locale of ['fa','en'] as const){
   const html=renderToStaticMarkup(createElement(HomeBanner,{locale}));
   expect(html).toContain(HOME_BANNER_DEFAULTS[locale].title);
   expect(html).toContain(HOME_BANNER_DEFAULTS[locale].subtitle);
   expect(html).toContain(`dir="${locale==='fa'?'rtl':'ltr'}"`);
   expect(html).toContain('scientific-design-banner-1920.webp');
   expect(html).not.toContain('shuffle-tile');
  }
 });
 it('preserves intentionally blank text while defaulting missing translations',()=>{
  const copy=normalizeHomeBanner({fa:{title:'عنوان سفارشی',subtitle:''}});
  expect(copy.fa).toEqual({title:'عنوان سفارشی',subtitle:''});
  expect(copy.en).toEqual(HOME_BANNER_DEFAULTS.en);
 });
 it('round-trips banner settings without replacing archived hero copy',async()=>{
  const content={...structuredClone(HOME_TEXT_DEFAULTS),banner:structuredClone(HOME_BANNER_DEFAULTS)};
  content.fa.title='متن بنر قدیمی'; content.banner.fa.title='بنر جدید';
  expect(normalizeHomeContent(content)).toEqual(content);
  await saveHomeContent(content);
  expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({content}),{onConflict:'id'});
  mocks.read.mockResolvedValue({data:{content},error:null});
  expect(await loadHomeContent()).toEqual(content);
 });
 it('rejects oversized banner copy before writing',async()=>{
  const content={...structuredClone(HOME_TEXT_DEFAULTS),banner:structuredClone(HOME_BANNER_DEFAULTS)};
  content.banner.fa.subtitle='x'.repeat(2001);
  await expect(saveHomeContent(content)).rejects.toThrow();
  expect(mocks.upsert).not.toHaveBeenCalled();
 });
});
