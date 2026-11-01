// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {AssetPreviewImage} from './AssetPreviewImage';

describe('preview recovery',()=>{
 it('falls back to the original once and uses a new derivative after a prop update',async()=>{
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  const host=document.createElement('div');const root=createRoot(host);
  try{
   await act(async()=>root.render(<AssetPreviewImage svg="" cacheKey="one" previewUrl="/asset-previews/one.webp" fallbackUrl="https://assets.test/original.png"/>));
   const image=host.querySelector('img')!;
   expect(image.getAttribute('src')).toBe('/asset-previews/one.webp');
   image.dispatchEvent(new Event('error'));expect(image.getAttribute('src')).toBe('https://assets.test/original.png');
   image.dispatchEvent(new Event('error'));expect(image.getAttribute('src')).toBe('https://assets.test/original.png');
   await act(async()=>root.render(<AssetPreviewImage svg="" cacheKey="two" previewUrl="/asset-previews/two.webp" fallbackUrl="https://assets.test/two.png"/>));
   expect(image.getAttribute('src')).toBe('/asset-previews/two.webp');
  }finally{await act(async()=>root.unmount());vi.unstubAllGlobals();}
 });
});
