// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from 'vitest';
import {createAssetThumbnail,thumbnailDimensions} from './assetThumbnail';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
describe('upload thumbnail generation',()=>{
 it('preserves aspect ratio without upscaling small images',()=>{
  expect(thumbnailDimensions(1600,800)).toEqual({width:192,height:96});
  expect(thumbnailDimensions(40,20)).toEqual({width:40,height:20});
  expect(()=>thumbnailDimensions(0,100)).toThrow('dimensions');
 });
 it('encodes a small preview and always releases the source blob URL',async()=>{
  const revoke=vi.fn();vi.stubGlobal('URL',{createObjectURL:()=> 'blob:test',revokeObjectURL:revoke});
  vi.stubGlobal('Image',class{naturalWidth=1600;naturalHeight=800;onload=()=>{};set src(_:string){this.onload();}});
  const draw=vi.fn();vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:draw} as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype,'toBlob').mockImplementation(function(callback){callback(new Blob(['preview'],{type:'image/webp'}));});
  const result=await createAssetThumbnail('<svg/>');expect(result.type).toBe('image/webp');expect(draw).toHaveBeenCalledWith(expect.anything(),0,0,192,96);expect(revoke).toHaveBeenCalledWith('blob:test');
 });
 it('times out a broken image without leaving an object URL allocated',async()=>{
  vi.useFakeTimers();const revoke=vi.fn();vi.stubGlobal('URL',{createObjectURL:()=> 'blob:test',revokeObjectURL:revoke});
  vi.stubGlobal('Image',class{set src(_:string){}});
  const result=expect(createAssetThumbnail('<svg/>')).rejects.toThrow('timed out');
  await vi.advanceTimersByTimeAsync(5000);await result;expect(revoke).toHaveBeenCalledOnce();
 });
});
