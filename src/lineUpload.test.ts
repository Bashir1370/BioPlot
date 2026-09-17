import {afterEach,describe,expect,it,vi} from 'vitest';
import {prepareLineUpload} from './lineUpload';
const header=new Uint8Array([137,80,78,71,13,10,26,10]);
afterEach(()=>vi.unstubAllGlobals());
describe('PNG line assets',()=>{
 it('rejects unsupported files, oversized uploads and renamed non-PNG data',async()=>{
  await expect(prepareLineUpload(new File(['text'],'line.txt',{type:'text/plain'}))).rejects.toThrow('SVG');
  await expect(prepareLineUpload(new File(['fake'],'line.png',{type:'image/png'}))).rejects.toThrow('PNG');
  await expect(prepareLineUpload(new File([new Uint8Array(2_500_001)],'line.png',{type:'image/png'}))).rejects.toThrow('۲.۵');
 });
 it('embeds PNG pixels and original aspect ratio without tracing or dropping transparency',async()=>{
  vi.stubGlobal('FileReader',class{
    result='data:image/png;base64,iVBORw0KGgo=';
    onload=()=>{};
    readAsDataURL(){this.onload();}
  });
  vi.stubGlobal('Image',class{naturalWidth=480;naturalHeight=120;onload=()=>{};set src(_:string){this.onload();}});
  const result=await prepareLineUpload(new File([header],'line.png',{type:'image/png'}));
  expect(result.sourceType).toBe('png');
  expect(result.svg).toContain('viewBox="0 0 480 120"');
  expect(result.svg).toContain('href="data:image/png;base64,iVBORw0KGgo="');
  expect(result.svg).not.toContain('<rect');
 });
 it('rejects oversized decoded images',async()=>{
  vi.stubGlobal('FileReader',class{result='data:image/png;base64,iVBORw0KGgo=';onload=()=>{};readAsDataURL(){this.onload();}});
  vi.stubGlobal('Image',class{naturalWidth=10000;naturalHeight=10000;onload=()=>{};set src(_:string){this.onload();}});
  await expect(prepareLineUpload(new File([header],'line.png',{type:'image/png'}))).rejects.toThrow('ابعاد');
 });
});
