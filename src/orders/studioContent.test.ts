import {describe,it,expect} from 'vitest';
import {normalizeStudioContent,defaultStudioContent,safeImageUrl} from './studioContentModel';
import {orderReturnPath} from './orderModel';
describe('studio content boundary',()=>{
 it('keeps complete defaults when schema is absent, but honors intentional removals',()=>{expect(normalizeStudioContent(null)).toEqual(defaultStudioContent);expect(normalizeStudioContent({blocks:[],copy:{'علم از شما.':{fa:'پژوهش شما',en:'Your research'}}}).blocks).toEqual([]);expect(normalizeStudioContent({copy:{'علم از شما.':{fa:'پژوهش شما'}}}).copy['علم از شما.']).toEqual({fa:'پژوهش شما',en:'Your science.'});});
 it('rejects executable media URLs and invalid/duplicate blocks',()=>{for(const url of ['javascript:alert(1)','data:image/svg+xml,<svg/>','http://example.test/image.png','//example.test/a'])expect(safeImageUrl(url)).toBe('');expect(safeImageUrl('https://example.test/a.png')).toBe('https://example.test/a.png');const b=defaultStudioContent.blocks[0];expect(normalizeStudioContent({blocks:[b,b,{...b,id:'other',type:'script'} as never]}).blocks).toHaveLength(1);});
 it('allows only a local admin return destination',()=>{expect(orderReturnPath('admin_studio')).toBe('/admin/studio');expect(orderReturnPath('https://example.test')).toBe(null);});
});
