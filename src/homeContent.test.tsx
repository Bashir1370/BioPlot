import {describe,it,expect,vi,beforeEach} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const mocks=vi.hoisted(()=>({read:vi.fn(),upsert:vi.fn(),user:vi.fn()}));
vi.mock('./supabaseClient',()=>({supabase:{auth:{getUser:mocks.user},from:()=>({select:()=>({eq:()=>({maybeSingle:mocks.read})}),upsert:mocks.upsert})}}));
import {loadHomeContent,saveHomeContent,normalizeHomeContent,HOME_TEXT_DEFAULTS} from './homeContent';
import {HomeHero} from './HomeHero';
import {ShuffleHero} from './components/ui/shuffle-grid';
beforeEach(()=>{vi.resetAllMocks();mocks.user.mockResolvedValue({data:{user:{id:'admin'}},error:null});mocks.upsert.mockResolvedValue({error:null});});
describe('Home content and image loading',()=>{
 it('renders local fallback images without external requests on the initial Home render',()=>{
 const html=renderToStaticMarkup(createElement(HomeHero,{locale:'fa',title:'title',highlight:'highlight',description:'description',primaryText:'create',secondaryText:'templates',socialProof:'',onCreate:()=>{}}));
 expect(html.match(/<img /g)).toHaveLength(16);expect(html).toContain('data:image/svg+xml,');expect(html).not.toContain('unsplash');expect(html).toContain('aria-busy="false"');
 });
 it('keeps failed loads neutral and offers retry instead of stock images',()=>{
 const html=renderToStaticMarkup(createElement(ShuffleHero,{loading:true,loadFailed:true}));expect(html).not.toContain('<img');expect(html).toContain('Retry loading images');expect(html).not.toContain('Pause animation');
 });
 it('preserves bilingual overrides and intentional empty optional text',()=>{
 const next=normalizeHomeContent({fa:{title:'عنوان جدید',socialProof:''},en:{title:'New title'}});
 expect(next.fa.title).toBe('عنوان جدید');expect(next.en.title).toBe('New title');expect(next.fa.socialProof).toBe('');expect(next.fa.primaryText).toBe(HOME_TEXT_DEFAULTS.fa.primaryText);
 });
 it('loads saved content and propagates read failures to the admin',async()=>{
 mocks.read.mockResolvedValue({data:{content:{en:{title:'Saved'}}},error:null});expect((await loadHomeContent()).en.title).toBe('Saved');
 mocks.read.mockResolvedValue({error:new Error('Offline')});await expect(loadHomeContent()).rejects.toThrow('Offline');
 });
 it('saves both locales in one authenticated write',async()=>{
 await saveHomeContent(HOME_TEXT_DEFAULTS);expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({id:1,content:HOME_TEXT_DEFAULTS,updated_by:'admin'}),{onConflict:'id'});
 });
 it('rejects anonymous or oversized writes and surfaces denied saves',async()=>{
 mocks.user.mockResolvedValue({data:{user:null}});await expect(saveHomeContent(HOME_TEXT_DEFAULTS)).rejects.toThrow();expect(mocks.upsert).not.toHaveBeenCalled();
 const content=structuredClone(HOME_TEXT_DEFAULTS);content.en.title='a'.repeat(2001);await expect(saveHomeContent(content)).rejects.toThrow();
 mocks.user.mockResolvedValue({data:{user:{id:'admin'}}});mocks.upsert.mockResolvedValue({error:new Error('Denied')});await expect(saveHomeContent(HOME_TEXT_DEFAULTS)).rejects.toThrow('Denied');
 });
});
